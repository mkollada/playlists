const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

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
      // Clear the search results
      searchResults.innerHTML = '';

      // Loop through the search results
      results.forEach(function(result) {
        // Create a new div element for each result
        const resultDiv = document.createElement('div');
        resultDiv.innerText = result.name + ' by: '

        console.log(result.artists.length)

        if (result.artists.length == 2) {
            for (let i = 0; i < result.artists.length - 1; i++){
                resultDiv.innerText = resultDiv.innerText + result.artists[i].name + ' '
            }

            resultDiv.innerText = resultDiv.innerText + '& '
        }
        else if (result.artists.length > 2 ) {
            for (let i = 0; i < result.artists.length - 1; i++){
                resultDiv.innerText = resultDiv.innerText + result.artists[i].name + ', '
            }

            resultDiv.innerText = resultDiv.innerText + '& '
        }

        resultDiv.innerText = resultDiv.innerText + result.artists[result.artists.length - 1].name;

        // Add the result to the search results
        searchResults.appendChild(resultDiv);
      });
    });
});