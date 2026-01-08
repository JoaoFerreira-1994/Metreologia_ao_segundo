// Using Open-Meteo API
const BASE_URL = "https://geocoding-api.open-meteo.com/v1";
const WEATHER_URL = "https://api.open-meteo.com/v1";

// Web Speech API
const recognition = window.SpeechRecognition || window.webkitSpeechRecognition ? 
  new (window.SpeechRecognition || window.webkitSpeechRecognition)() : null;

if (recognition) {
  recognition.lang = "pt-BR";
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = function() {
    document.getElementById("status_voz").textContent = "🎤 Listening...";
    document.getElementById("status_voz").style.color = "#ffeb3b";
  };

  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript;
    document.getElementById("input_cidade").value = transcript;
    document.getElementById("status_voz").textContent = `You said: "${transcript}"`;
    buscarMetereologia();
  };

  recognition.onerror = function(event) {
    document.getElementById("status_voz").textContent = "❌ Error: " + event.error;
    document.getElementById("status_voz").style.color = "#ff6b6b";
  };

  recognition.onend = function() {
    document.getElementById("status_voz").textContent = "";
  };
}

function iniciarReconhecimentoVoz() {
  if (!recognition) {
    alert("Your browser does not support speech recognition.");
    return;
  }
  recognition.start();
}

async function buscarMetereologia() {
  const cidade = document.getElementById("input_cidade").value.trim();
  
  if (!cidade) {
    document.getElementById("aviso").textContent = "Please enter a city name.";
    return;
  }

  try {
    // Buscar coordenadas da cidade
    const geoResponse = await fetch(
      `${BASE_URL}/search?name=${encodeURIComponent(cidade)}&count=1&language=en&format=json`
    );

    if (!geoResponse.ok) {
      throw new Error("Error fetching city");
    }

    const geoData = await geoResponse.json();
    
    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("City not found");
    }

    const local = geoData.results[0];
    const { latitude, longitude, name, country } = local;

    // Buscar dados meteorológicos (incluir probabilidades e campos horários necessários)
    const weatherResponse = await fetch(
      `${WEATHER_URL}/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,relative_humidity_2m,apparent_temperature,pressure_msl,wind_speed_10m&hourly=temperature_2m,weather_code,precipitation_probability,relativehumidity_2m,windspeed_10m,pressure_msl&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto&language=en`
    );

    if (!weatherResponse.ok) {
      throw new Error("Error fetching weather data");
    }

    const weatherData = await weatherResponse.json();

    // armazenar para uso posterior (detalhes diários/hora)
    window._lastWeatherData = weatherData;

    // Exibir informações
    exibirMetereologiaAtual(weatherData, name, country);
    exibirPrevisao(weatherData);

  } catch (error) {
    console.error("Error:", error);
    document.getElementById("display_meteorologia").innerHTML = 
      `<p class="erro">❌ Error: ${error.message}</p>`;
    document.getElementById("previsao").innerHTML = "";
  }
}

// Mapa de códigos WMO para descrições e ícones
const weatherCodeMap = {
  0: { desc: "Clear sky", icon: "☀️" },
  1: { desc: "Mainly clear", icon: "🌤️" },
  2: { desc: "Partly cloudy", icon: "⛅" },
  3: { desc: "Overcast", icon: "☁️" },
  45: { desc: "Fog", icon: "☁️" },
  48: { desc: "Freezing fog", icon: "❄️☁️" },
  51: { desc: "Light drizzle", icon: "🌦️" },
  53: { desc: "Moderate drizzle", icon: "🌧️" },
  55: { desc: "Dense drizzle", icon: "🌧️" },
  61: { desc: "Light rain", icon: "🌧️" },
  63: { desc: "Moderate rain", icon: "🌧️" },
  65: { desc: "Heavy rain", icon: "⛈️" },
  71: { desc: "Light snow", icon: "🌨️" },
  73: { desc: "Moderate snow", icon: "🌨️" },
  75: { desc: "Heavy snow", icon: "🌨️" },
  77: { desc: "Snow grains", icon: "🌨️" },
  80: { desc: "Rain showers", icon: "🌦️" },
  81: { desc: "Moderate rain showers", icon: "🌧️" },
  82: { desc: "Violent rain showers", icon: "⛈️" },
  85: { desc: "Slight snow showers", icon: "🌨️" },
  86: { desc: "Heavy snow showers", icon: "🌨️" },
  95: { desc: "Thunderstorm", icon: "⛈️" },
  96: { desc: "Thunderstorm with hail", icon: "⛈️" },
  99: { desc: "Severe thunderstorm with hail", icon: "⛈️" }
};

function getWeatherInfo(code) {
  return weatherCodeMap[code] || { desc: "Unknown", icon: "❓" };
}

function exibirMetereologiaAtual(dados, cidade, pais) {
  const current = dados.current;
  const temp = Math.round(current.temperature_2m);
  const sensacao = Math.round(current.apparent_temperature);
  const umidade = current.relative_humidity_2m;
  const velocidadeVento = Math.round(current.wind_speed_10m);
  const pressao = Math.round(current.pressure_msl);
  const weatherInfo = getWeatherInfo(current.weather_code);

  const html = `
    <div class="info-cidade">
      📍 ${cidade}, ${pais}
    </div>
    
    <div class="temperatura-principal">
      <div style="font-size: 60px; margin: 10px 0;">${weatherInfo.icon}</div>
      <div>${temp}°C</div>
    </div>
    
    <div class="descricao-clima">${weatherInfo.desc}</div>
    
    <div class="grid-info">
        <div class="info-item">
          <div class="info-label">Feels Like</div>
          <div class="info-valor sensacao-termica">${sensacao}°C</div>
        </div>
      
        <div class="info-item">
          <div class="info-label">Humidity</div>
          <div class="info-valor umidade">${umidade}%</div>
        </div>
      
        <div class="info-item">
          <div class="info-label">Wind</div>
          <div class="info-valor vento">${velocidadeVento} km/h</div>
        </div>
      
        <div class="info-item">
          <div class="info-label">Pressure</div>
          <div class="info-valor pressao">${pressao} hPa</div>
        </div>
    </div>
  `;

  document.getElementById("display_meteorologia").innerHTML = html;
}

function exibirPrevisao(dados) {
  const daily = dados.daily;
  const times = daily.time;
  const temps_max = daily.temperature_2m_max;
  const temps_min = daily.temperature_2m_min;
  const codes = daily.weather_code;

  let html = '<div class="previsao-titulo">📅 7-Day Forecast</div><div class="dias-previsao">';
  
  // Guardar dados dos dias para uso posterior
  window._dailyData = { times, temps_max, temps_min, codes };
  
  // Mostrar próximos 5 dias
  for (let i = 0; i < Math.min(5, times.length); i++) {
    const data = new Date(times[i]);
    const dia = data.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
    const weatherInfo = getWeatherInfo(codes[i]);

    html += `
      <div class="dia-previsao" data-index="${i}" onclick="exibirDiaSelecionado(${i})">
        <div class="dia-nome">${dia}</div>
        <div style="font-size: 30px; margin: 5px 0;">${weatherInfo.icon}</div>
        <div class="dia-temp">${Math.round(temps_min[i])}° - ${Math.round(temps_max[i])}°</div>
        <div class="dia-desc">${weatherInfo.desc}</div>
      </div>
    `;
  }

  html += '</div>';
  document.getElementById("previsao").innerHTML = html;
}

// Exibe o dia selecionado no topo
function exibirDiaSelecionado(index) {
  if (!window._dailyData) return;

  // extrai umidade, vento, pressão e probabilidade para o dia selecionado
  function getDailyDetails(idx) {
    const last = window._lastWeatherData;
    const result = { humidity: '—', wind: '—', pressure: '—', precip: '—' };
    if (!last) return result;

    const dateStr = window._dailyData.times[idx].slice(0,10); // YYYY-MM-DD

    // current values for today
    if (idx === 0 && last.current) {
      result.humidity = last.current.relative_humidity_2m ?? last.current.relativehumidity_2m ?? result.humidity;
      result.wind = last.current.wind_speed_10m ?? last.current.windspeed_10m ?? result.wind;
      result.pressure = last.current.pressure_msl ?? last.current.surface_pressure ?? result.pressure;
      if (last.daily && last.daily.precipitation_probability_max) {
        const di = last.daily.time.findIndex(t => t === dateStr);
        if (di >= 0) result.precip = Math.round(last.daily.precipitation_probability_max[di]);
      }
      return result;
    }

    // otherwise try hourly nearest to midday
    if (last.hourly && last.hourly.time) {
      const times = last.hourly.time;
      let bestIdx = -1;
      for (let i = 0; i < times.length; i++) {
        if (times[i].startsWith(dateStr)) {
          const hr = new Date(times[i]).getHours();
          if (hr === 12) { bestIdx = i; break; }
          if (bestIdx === -1) bestIdx = i;
        }
      }
      if (bestIdx >= 0) {
        if (last.hourly.relativehumidity_2m) result.humidity = Math.round(last.hourly.relativehumidity_2m[bestIdx]);
        if (last.hourly.windspeed_10m) result.wind = Math.round(last.hourly.windspeed_10m[bestIdx]);
        if (last.hourly.pressure_msl) result.pressure = Math.round(last.hourly.pressure_msl[bestIdx]);
        if (last.hourly.precipitation_probability) result.precip = Math.round(last.hourly.precipitation_probability[bestIdx]);
      }
    }

    return result;
  }

  const { times, temps_max, temps_min, codes } = window._dailyData;
  const data = new Date(times[index]);
  const dia_completo = data.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const weatherInfo = getWeatherInfo(codes[index]);
  
  const details = getDailyDetails(index);

  const html = `
    <div class="dia-selecionado-titulo">📅 ${dia_completo}</div>
    <div class="dia-selecionado-icon">${weatherInfo.icon}</div>
    <div style="font-size: 16px; color: #e0e0e0; margin: 10px 0;">${weatherInfo.desc}</div>
    
    <div class="dia-selecionado-info">
      <div class="info-item">
        <div class="info-label">Min</div>
        <div class="info-valor">${Math.round(temps_min[index])}°C</div>
      </div>
      <div class="info-item">
        <div class="info-label">Max</div>
        <div class="info-valor">${Math.round(temps_max[index])}°C</div>
      </div>
      <div class="info-item">
        <div class="info-label">Humidity</div>
        <div class="info-valor">${details.humidity !== '—' ? details.humidity + '%' : '—'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Wind</div>
        <div class="info-valor">${details.wind !== '—' ? details.wind + ' km/h' : '—'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Pressure</div>
        <div class="info-valor">${details.pressure !== '—' ? details.pressure + ' hPa' : '—'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Chance of Rain</div>
        <div class="info-valor">${details.precip !== '—' ? details.precip + '%' : '—'}</div>
      </div>
    </div>
  `;

  const container = document.getElementById("dia_selecionado");
  container.innerHTML = html;
  container.style.display = "block";

  // Marcar como selecionado
  document.querySelectorAll(".dia-previsao").forEach((el, i) => {
    el.classList.toggle("selected", i === index);
  });
}
