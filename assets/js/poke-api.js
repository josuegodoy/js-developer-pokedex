
const pokeApi = {}

//Get Monster List
pokeApi.getPokemons = (offset = 0, limit = 5) => {
    const url = `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`

    return fetch(url)
        .then((response) => response.json())
        .then((jsonBody) => jsonBody.results)
        .then((pokemons) => pokemons.map(pokeApi.getPokemonDetail))
        .then((detailRequests) => Promise.all(detailRequests))
        .then((pokemonsDetails) => pokemonsDetails)
}

//Get more details
pokeApi.getPokemonDetail = (pokemon) => {
    return fetch(pokemon.url)
        .then((response) => response.json())
        .then(convertPokeApiDetailToPokemon)
        .then(getInfoSpecies)
        .then(getEvolutions)
}

//Convert API data to Pokemon object
function convertPokeApiDetailToPokemon(pokeDetail) {
    const pokemon = new Pokemon()
    pokemon.photo = pokeDetail.sprites.other.dream_world.front_default
    pokemon.number = pokeDetail.id
    pokemon.name = pokeDetail.name
    pokemon.height = pokeDetail.height;
    pokemon.weight = pokeDetail.weight;
    pokemon.baseExp = pokeDetail.base_experience;

    const abilities = pokeDetail.abilities.map((abilitySlot) => abilitySlot.ability.name)
    const [ability] = abilities

    pokemon.abilities = abilities;
    pokemon.ability = ability;

    const types = pokeDetail.types.map((typeSlot) => typeSlot.type.name)
    const [type] = types

    pokemon.types = types
    pokemon.type = type

    const moves = pokeDetail.moves.map((moveSlot) => moveSlot.move.name)
    const [move] = moves

    pokemon.moves = moves
    pokemon.move = move

    const stats = pokeDetail.stats.map((statSlot) => statSlot.base_stat)
    const [stat] = stats

    pokemon.stats = stats
    pokemon.stat = stat

    return pokemon
}

//Get more information about monster species
function getInfoSpecies(pokemon) {
    const url = `https://pokeapi.co/api/v2/pokemon-species/${pokemon.number}`;
    
    return fetch(url)
        .then(response => response.json())
        .then((data) => {
            const filteredFlavorTextEntries = data.flavor_text_entries.filter(
                (element) => element.language.name === "en"
            );
            
            //Cria as variáveis da informações
            let description = filteredFlavorTextEntries[0].flavor_text;
            let generation = data.generation.name;
            let generationSplit = generation.split('-');
            let generationUpper = generationSplit[0].charAt(0).toUpperCase() + generationSplit[0].substring(1) + ' ' + generationSplit[1].toUpperCase();
            let evolutionSplit = data.evolution_chain.url.split('/', 7);
            let evolution = evolutionSplit[6];

            let eggsNames = data.egg_groups.map((e) => {
                return e.name;
            });

            let eggsUpper = eggsNames.map ((e) => {
                return e.charAt(0).toUpperCase() + e.substring(1);
            })

            //Insere as informações tratadas dentro da classe Pokemon
            pokemon.eggGroups = eggsUpper.join(', ');
            pokemon.generation = generationUpper;         
            pokemon.description = description.replace('', ' ');
            pokemon.evolutionChain = evolution;

            return pokemon;
        })
}

//Get evolution chain from API
function getEvolutions(pokemon) {
    const url = `https://pokeapi.co/api/v2/evolution-chain/${pokemon.evolutionChain}`;
    
    fetch(url)
        .then(response => response.json())
        .then((data) => {

            //Pokemons with multiple evolution chains
            if (pokemon.evolutionChain != 67 &&
                pokemon.evolutionChain != 47 &&
                pokemon.evolutionChain != 213){
                if(data.chain.evolves_to[0] != null){
                    if (data.chain.evolves_to[0].evolves_to[0] != null){
                        pokemon.evolutions = [data.chain.species.name,
                                            data.chain.evolves_to[0].species.name,
                                            data.chain.evolves_to[0].evolves_to[0].species.name]

                        //Get evolution chains URL
                        let evolution1 = data.chain.species.url;
                        let evolution2 = data.chain.evolves_to[0].species.url;
                        let evolution3 = data.chain.evolves_to[0].evolves_to[0].species.url;

                        //Split urls with slash to get id
                        let evolId1 = evolution1.split('/');
                        let evolId2 = evolution2.split('/');
                        let evolId3 = evolution3.split('/');

                        //Replace id on picture url template
                        let urlSprite = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/'
                        
                        pokemon.evolutionsSprites = [`${urlSprite}${evolId1[6]}.svg`,
                                                     `${urlSprite}${evolId2[6]}.svg`,
                                                     `${urlSprite}${evolId3[6]}.svg`];
                    } else {
                        pokemon.evolutions = [data.chain.species.name,
                                            data.chain.evolves_to[0].species.name]  
                
                        //Get evolution chains URL
                        let evolution1 = data.chain.species.url;
                        let evolution2 = data.chain.evolves_to[0].species.url;

                        //Split urls with slash to get id
                        let evolId1 = evolution1.split('/');
                        let evolId2 = evolution2.split('/');

                        //Replace id on picture url template
                        let urlSprite = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/'
                        
                        pokemon.evolutionsSprites = [`${urlSprite}${evolId1[6]}.svg`,
                                                     `${urlSprite}${evolId2[6]}.svg`,]
                    }                
                } else{
                    pokemon.evolutions = "The Pokémon doesn't have an evolution.";
                }
            } else {
                data.chain.evolves_to.map((evolv) => {
                    pokemon.evolutions += evolv.species.name.charAt(0).toUpperCase() + evolv.species.name.substring(1) + ', ';

                    //Split urls with slash to get id
                    let evolutions = evolv.species.url;
                    let evolId = evolutions.split('/');

                    // Replace id on picture url template
                    let urlSprite = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/'
                    
                    pokemon.evolutionsSprites += [`${urlSprite}${evolId[6]}.svg`]
                })     
            }
        })
        
    return pokemon;
}