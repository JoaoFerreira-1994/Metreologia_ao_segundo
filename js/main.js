// Variáveis Globais
const input_cidade = document.getElementById("input_cidade");
const btn_buscar = document.getElementById("btn_buscar");
const btn_voz = document.getElementById("btn_voz");

// Executar busca ao pressionar Enter
input_cidade.addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    buscarMetereologia();
  }
});

// Disable voice button if browser does not support it
if (!recognition) {
  btn_voz.disabled = true;
  btn_voz.style.opacity = "0.5";
  btn_voz.title = "Your browser does not support speech recognition";
}

// Fetch weather for a default city on load
window.addEventListener("load", function() {
  input_cidade.value = "Lisboa";
  buscarMetereologia();
});
