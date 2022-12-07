const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const selectedSongsDiv = document.getElementById('selected-songs');

var selected_songs_arr = []

// add song to selected songs
function add_to_selected(selected_arr, song) {
    selected_arr.push(song);
}

// remove song from selected songs
// - removes first instance it finds
function remove_from_selected(selected_arr, song) {
    selected_arr.forEach(function(arr_song, index, _) {
        if (song == arr_song) {
            selected_arr.splice(index, 1);
            return selected_arr;
        };
        return selected_arr;
    });
}

function get_index_from_result_div_id(resultDiv) {
    var items = resultDiv.id.split('-');
    return parseInt( items[items.length - 1] );
}

function display_search_results(searchResults, results) {
  // Clear the search results
  searchResults.innerHTML = '';

  // Loop through the search results
  results.forEach(function(track, loop_index, _) {
    // Create a new div element for each result
    const resultDiv = document.createElement('div');
    resultDiv.id = 'result-div-' + loop_index;
    const resultButton = document.createElement('button');
    resultButton.id = 'result-button-' + loop_index;

    // Flip color of clicked button
    resultButton.addEventListener('click', function onClick() {
        select_song(track, selected_songs_arr, selectedSongsDiv)
    });

    resultDiv.appendChild(resultButton)

    resultButton.innerText = get_song_and_artist_name(track)

    // Add the result to the search results
    searchResults.appendChild(resultDiv);
  });
}

// input is spotify track
function get_selected_song_div_id(track) {
    return track.uri + '-selected-div';
}

// input is spotify track
function get_song_and_artist_name(track) {
    var name = ''

    name = track.name + ' by: '

    if (track.artists.length == 2) {
        for (let i = 0; i < track.artists.length - 1; i++){
            name = name + track.artists[i].name + ' ';
        }

        name = name + '& ';
    }
    else if (track.artists.length > 2 ) {
        for (let i = 0; i < track.artists.length - 1; i++){
            name = name + track.artists[i].name + ', ';
        }

        name = name + '& ';
    }

    name = name + track.artists[track.artists.length - 1].name;

    return name;
}

// checking if the song is already selected
// - TODO: idk if this is the best method
function get_index_of_selected_song(song, selected_songs_arr) {
    var selected_index = false;
    selected_songs_arr.forEach(function(selected_song, index, _) {
        if (selected_song.uri === song.uri) {
            selected_index = index;
        }
    });
    return selected_index;
}

// error message for if you try to select a song and its already selected
function already_selected_error() {
    console.log('This song is already selected');
}

// error message for if you try to unselect a song and its not selected
function not_selected_error() {
    console.log('You tried removing a song that isnt selected');
}

// adds a selected song to the selected song display list
function add_selected_song_to_display(track, selectedSongsDiv) {

    // Outer div to hold name and x button next to each other
    const selectedDiv = document.createElement('div');
    selectedDiv.setAttribute('id', get_selected_song_div_id(track));

    // Inner div for name of song
    const selectedDivName = document.createElement('div');
    selectedDivName.setAttribute('id', get_selected_song_div_id(track) + '-name');
    selectedDivName.innerText = get_song_and_artist_name(track);
    selectedDivName.style.display = "inline-block";

    // X button to unselect song
    const selectedDivXBtn = document.createElement('button');
    selectedDivXBtn.setAttribute('id', get_selected_song_div_id(track) + '-xbtn');
    selectedDivXBtn.style.display = "inline-block";
    selectedDivXBtn.innerText = 'X'
    selectedDivXBtn.addEventListener('click', function onClick() {
        unselect_song(track, selected_songs_arr, selectedSongsDiv);
    });

    // Add name and button to outer div
    selectedDiv.appendChild(selectedDivName);
    selectedDiv.appendChild(selectedDivXBtn);

    // Add outer div to selected song div
    selectedSongsDiv.appendChild(selectedDiv);

    return selectedSongsDiv;
}

function select_song(song, selected_songs_arr, selectedSongsDiv){
    const selected_index = get_index_of_selected_song(song, selected_songs_arr);
    if (!Number.isInteger(selected_index)) {
        selected_songs_arr.push(song);
        add_selected_song_to_display(song, selectedSongsDiv);
    } else {
        already_selected_error();
    }
}

// removes song that the user has unselected from the selected songs display
function remove_unselected_song_from_display(track){
    // TODO
    const selected_div_id = get_selected_song_div_id(track);

    var selectedDiv = document.getElementById(selected_div_id);
    var parent = selectedDiv.parentNode;
    parent.removeChild(selectedDiv);
}

function unselect_song(track, selected_songs_arr, selectedSongsDiv) {
    const selected_index = get_index_of_selected_song(track, selected_songs_arr);
    if (Number.isInteger(selected_index)) {
        selected_songs_arr.splice(selected_index, 1);
        remove_unselected_song_from_display(track);
    } else {
        not_selected_error();
    }
}




// Add event listener to the search input
searchInput.addEventListener('keyup', function() {
  // Get the search query from the search input
  const query = this.value;

  // Send an AJAX request to the server to perform the search
  fetch("/search?query=" + query)
    .then(function(response) {
      // Parse the response as JSON
      return response.json();
    })
    .then(function(results) {

        display_search_results(searchResults, results);

    });
});