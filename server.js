// server.js
// Servidor Express que atua como uma API para buscar dados de clima e associá-los a Pokémon.

// Importa os módulos necessários
import express from 'express';
import fetch from 'node-fetch'; // Usado para fazer requisições HTTP para APIs externas

// Inicializa a aplicação Express
const app = express();
// Define a porta do servidor, usando a variável de ambiente PORT ou 3000 como padrão
const PORT = process.env.PORT || 3000;

// Configura o Express para servir arquivos estáticos (HTML, CSS, JS) da pasta 'public'
app.use(express.static('public'));

/**
 * Mapeia o código de clima (WMO code) do Open-Meteo para um tipo de Pokémon.
 * O mapeamento é simplificado e usa números aleatórios entre os tipos relevantes.
 * @param {number} weatherCode - O código de tempo atual retornado pela Open-Meteo.
 * @returns {string} O tipo de Pokémon (em minúsculas, ex: 'fire', 'water').
 */
function mapWeatherToPokemonType(weatherCode) {
  // 0-3: Céu limpo a parcialmente nublado (Sol/Nuvens)
  if (weatherCode >= 0 && weatherCode <= 3) { 
    const types = ['fire', 'electric', 'flying'];
    // Escolhe aleatoriamente um dos tipos (Fogo, Elétrico, Voador)
    return types[Math.floor(Math.random() * types.length)];
  } 
  // 51-67: Chuva fraca, moderada ou forte
  else if (weatherCode >= 51 && weatherCode <= 67) { 
    return 'water'; // Tipo Água
  } 
  // 71-75: Neve
  else if (weatherCode >= 71 && weatherCode <= 75) { 
    return 'ice'; // Tipo Gelo
  } 
  // 45-48: Neblina
  else if (weatherCode >= 45 && weatherCode <= 48) { 
    return 'ghost'; // Tipo Fantasma (para neblina, pode ser atmosférico)
  } 
  // Outros (default: nuvens, garoa, etc.)
  else { 
    const types = ['normal', 'grass'];
    // Escolhe aleatoriamente (Normal ou Grama)
    return types[Math.floor(Math.random() * types.length)];
  }
}

/**
 * Rota principal para buscar dados de clima e Pokémon.
 * Endpoint: GET /api/weather-pokemon?city=Nome+da+Cidade
 */
app.get('/api/weather-pokemon', async (req, res) => {
  // Extrai o nome da cidade da query string
  const city = req.query.city;
  // Verifica se o parâmetro 'city' foi fornecido
  if (!city) return res.status(400).json({ error: 'Parâmetro city é obrigatório' });

  try {
    // 1) Geocoding (Nominatim): Converte o nome da cidade em Latitude e Longitude
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
    const nomRes = await fetch(nominatimUrl, {
      // É obrigatório enviar um User-Agent para o Nominatim
      headers: { 'User-Agent': 'clima-pokemon-app/1.0 (+https://example.com)' }
    });
    const nomData = await nomRes.json();

    // Verifica se a cidade foi encontrada
    if (!nomData || nomData.length === 0) {
      return res.status(404).json({ error: 'Cidade não encontrada' });
    }

    // Extrai as coordenadas e o nome formatado
    const lat = nomData[0].lat;
    const lon = nomData[0].lon;
    const displayName = nomData[0].display_name;

    // 2) Open-Meteo: Consulta o clima atual
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    let pokemonType = 'normal'; // Tipo padrão
    let pokemonImageUrl = '';
    let pokemonName = 'Pokémon';

    // Se houver dados de clima válidos e o código de tempo existir
    if (weatherData.current_weather && weatherData.current_weather.weathercode !== undefined) {
      // Mapeia o código de tempo para um tipo de Pokémon
      pokemonType = mapWeatherToPokemonType(weatherData.current_weather.weathercode);

      // 3) PokeAPI: Busca um Pokémon do tipo associado ao clima
      // Primeiro, busca todos os Pokémon daquele tipo
      const typeUrl = `https://pokeapi.co/api/v2/type/${pokemonType}/`;
      const typeRes = await fetch(typeUrl);
      const typeData = await typeRes.json();

      if (typeData.pokemon && typeData.pokemon.length > 0) {
        // Escolhe um Pokémon aleatório da lista de Pokémon daquele tipo
        const randomIndex = Math.floor(Math.random() * typeData.pokemon.length);
        const pokemonInfoUrl = typeData.pokemon[randomIndex].pokemon.url;
        
        // Busca os detalhes (incluindo a imagem) do Pokémon escolhido
        const pokemonRes = await fetch(pokemonInfoUrl);
        const pokemonData = await pokemonRes.json();

        // Usa o sprite frontal padrão para a imagem
        pokemonImageUrl = pokemonData.sprites.front_default;
        pokemonName = pokemonData.name;
      }
    }

    // Retorna a resposta combinada de clima e Pokémon
    res.json({
      city: displayName,
      latitude: lat,
      longitude: lon,
      weather: weatherData.current_weather || null,
      pokemon: {
        type: pokemonType,
        name: pokemonName,
        imageUrl: pokemonImageUrl
      }
    });

  } catch (err) {
    // Loga o erro interno para depuração e retorna uma resposta de erro para o cliente
    console.error('Erro geral ao buscar clima ou Pokémon:', err.message);
    res.status(500).json({ error: 'Erro ao buscar dados ou Pokémon', details: err.message });
  }
});

// Inicia o servidor e o faz escutar na porta definida (PORT)
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});