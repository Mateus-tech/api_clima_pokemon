
const $ = sel => document.querySelector(sel);

const cityInput = $('#city-input');
const searchBtn = $('#search-btn');
const randomBtn = $('#random-btn');

const imageWrapper = $('#image-wrapper');
const locationTitle = $('#location-title');
const weatherSummary = $('#weather-summary');
const tempSpan = $('#temp');
const windSpan = $('#wind');
const winddirSpan = $('#winddir');
const extraInfo = $('#extra-info');
const pokemonInfo = $('#pokemon-info'); 

// Exemplos aleatórios
const examples = ['Lisbon, PT','Salvador, BR','Tokyo, JP','New York, US','Cape Town, ZA'];

//  resetar o estado visual
function resetUI() {
    locationTitle.textContent = 'Carregando...';
    weatherSummary.textContent = '';
    tempSpan.textContent = '—';
    windSpan.textContent = '—';
    winddirSpan.textContent = '—';
    extraInfo.textContent = '';
    pokemonInfo.textContent = ''; // Limpa info do Pokémon
    imageWrapper.style.backgroundImage = 'none';
    imageWrapper.style.backgroundColor = '#e9eef8'; // Cor de fundo padrão
}

// Função principal: busca clima e Pokémon
async function searchCity(city) {
  if(!city) return alert('Digite uma cidade');
  
  resetUI(); // Reseta 

  try {
    // 1. Requisição para a nova rota combinada de clima e Pokémon
    const response = await fetch(`/api/weather-pokemon?city=${encodeURIComponent(city)}`);

    // 2. Verifica se  falhou
    if(!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Erro ao obter dados de clima e Pokémon.');
    }
    
 
    const data = await response.json();
    
    // Atualiza  dados do clima
    locationTitle.textContent = data.city || city;
    if(data.weather) {
      weatherSummary.textContent = 'Condições atuais';
      tempSpan.textContent = `${data.weather.temperature}°C`;
      windSpan.textContent = `${data.weather.windspeed} m/s`;
      winddirSpan.textContent = `${data.weather.winddirection}°`;
      extraInfo.textContent = `Latitude: ${data.latitude}, Longitude: ${data.longitude}`;
    } else {
      weatherSummary.textContent = 'Clima indisponível';
    }

    // 4. Atualiza imagem e info do Pokémon
    if (data.pokemon && data.pokemon.imageUrl) {
        imageWrapper.style.backgroundImage = `url('${data.pokemon.imageUrl}')`;
        imageWrapper.style.backgroundSize = 'contain'; // Para Pokémon, use 'contain'
        imageWrapper.style.backgroundRepeat = 'no-repeat';
        pokemonInfo.textContent = `Pokémon do tipo ${data.pokemon.type}: ${data.pokemon.name}`;
    } else {
        console.warn('Nenhuma imagem de Pokémon ou informações encontradas.');
        imageWrapper.style.backgroundImage = 'none';
        pokemonInfo.textContent = 'Nenhum Pokémon encontrado para este clima.';
    }

  } catch (err) {
    console.error('ERRO GERAL:', err);
    locationTitle.textContent = 'Erro';
    weatherSummary.textContent = err.message || 'Erro desconhecido ao carregar dados';
    pokemonInfo.textContent = '';
    imageWrapper.style.backgroundImage = 'none';
  }
}

// Eventos
searchBtn.addEventListener('click', () => {
  searchCity(cityInput.value.trim());
});

cityInput.addEventListener('keypress', (e) => {
  if(e.key === 'Enter') searchCity(cityInput.value.trim());
});

randomBtn.addEventListener('click', () => {
  const choice = examples[Math.floor(Math.random()*examples.length)];
  cityInput.value = choice;
  searchCity(choice);
});

// Carrega um exemplo 
document.addEventListener('DOMContentLoaded', () => {
  const initCity = 'Feira de santana'
  cityInput.value = initCity;
  searchCity(initCity);
});