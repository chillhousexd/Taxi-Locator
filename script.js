document.addEventListener("DOMContentLoaded", () => {
  let map;
  let markers = [];
  let polylines = [];
  const API_KEY = "tNLDcOe2j8ZwyzeYL5stJiwUWqUxOm5qbWR3Yd4k";

  const routes = {
    cab1: [
      [85.04182, 25.6229], // Shaguna More
      [85.045242, 25.620511],
      [85.047765, 25.618486],
      [85.051639, 25.615372],
      [85.054449, 25.613194],
      [85.054979, 25.612827],
      [85.057341, 25.611273],
      [85.058722, 25.610739],
      [85.06407, 25.608561],
      [85.069974, 25.606674],
      [85.074867, 25.605985],
      [85.081349, 25.605307],
      [85.087351, 25.604607],
      [85.092339, 25.60444],
      [85.100596, 25.604206],
      [85.102543, 25.603906], // Patna Zoo
    ],
    cab2: [
      [85.043537, 25.583463], // Danapur Station
      [85.043537, 25.584808],
      [85.043441, 25.586424],
      [85.043298, 25.587743],
      [85.043104, 25.59028],
      [85.043038, 25.592066],
      [85.042834, 25.596358],
      [85.042649, 25.599693],
      [85.042464, 25.603171],
      [85.042253, 25.608057],
      [85.041758, 25.616092],
      [85.041542, 25.620482],
      [85.041441, 25.62317], // Shaguna More
    ],
    cab3: [
      [85.041441, 25.62317], // Shaguna More
      [85.041268, 25.624949],
      [85.041196, 25.627078],
      [85.041081, 25.629623],
      [85.040965, 25.632532],
      [85.040418, 25.635752],
      [85.040245, 25.63666],
      [85.044062, 25.637336],
      [85.04494, 25.637439],
      [85.044494, 25.639673],
      [85.045387, 25.640555],
      [85.045257, 25.642191], // Ganga River
    ],
  };

  function initMap(lat = 25.623094, lng = 85.041852) {
    map = new ol.Map({
      target: "map",
      view: new ol.View({
        center: ol.proj.fromLonLat([lng, lat]),
        zoom: 14,
      }),
      layers: [
        new ol.layer.Tile({
          source: new ol.source.OSM(),
        }),
      ],
    });
  }

  function moveCabAlongRoute(
    cabMarker,
    route,
    index = 0,
    duration = 2000,
    polylineCoords = [],
    isReturning = false
  ) {
    if (index >= route.length - 1 && !isReturning) {
      console.log("Cab reached the final destination! Returning to start...");
      moveCabAlongRoute(cabMarker, route.reverse(), 0, duration, [], true);
      return;
    }

    if (index >= route.length - 1 && isReturning) {
      console.log("Cab returned to the starting point!");
      return;
    }

    let startLat = route[index][1];
    let startLng = route[index][0];
    let endLat = route[index + 1][1];
    let endLng = route[index + 1][0];
    let startTime = performance.now();

    function animate(currentTime) {
      let elapsed = currentTime - startTime;
      let progress = Math.min(elapsed / duration, 1);

      let newLat = startLat + progress * (endLat - startLat);
      let newLng = startLng + progress * (endLng - startLng);

      cabMarker.setPosition(ol.proj.fromLonLat([newLng, newLat]));
      polylineCoords.push([newLng, newLat]);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        console.log(`Cab reached waypoint ${index + 1}`);
        drawPolyline(polylineCoords, isReturning);
        moveCabAlongRoute(
          cabMarker,
          route,
          index + 1,
          duration,
          polylineCoords,
          isReturning
        );
      }
    }

    requestAnimationFrame(animate);
  }

  function drawPolyline(coords, isReturning = false) {
    let polyline = new ol.layer.Vector({
      source: new ol.source.Vector({
        features: [
          new ol.Feature({
            geometry: new ol.geom.LineString(
              coords.map((coord) => ol.proj.fromLonLat(coord))
            ),
          }),
        ],
      }),
      style: new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: isReturning ? "red" : "blue",
          width: 3,
        }),
      }),
    });
    map.addLayer(polyline);
    polylines.push(polyline);
  }

  function fetchSuggestions(query) {
    if (!query) return;
    fetch(
      `https://api.olamaps.io/places/v1/autocomplete?input=${query}&api_key=${API_KEY}`
    )
      .then((response) => response.json())
      .then((data) => {
        const suggestionsBox = document.getElementById("suggestionsBox");
        suggestionsBox.innerHTML = "";
        if (data.predictions && data.predictions.length > 0) {
          data.predictions.forEach((prediction) => {
            const suggestionItem = document.createElement("div");
            suggestionItem.classList.add("suggestion-item");
            suggestionItem.textContent = prediction.description;

            suggestionItem.addEventListener("click", () => {
              document.getElementById("searchBox").value =
                prediction.description;
              searchLocation(prediction.description);
              suggestionsBox.innerHTML = ""; // Clear suggestions after selection
            });
            suggestionsBox.appendChild(suggestionItem);
          });
        }
      })
      .catch((error) => console.error("Error fetching suggestions:", error));
  }

  function searchLocation(query) {
    if (!query) return;
    fetch(
      `https://api.olamaps.io/places/v1/geocode?address=${query}&language=hi&api_key=${API_KEY}`
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.geocodingResults && data.geocodingResults.length > 0) {
          const { lat, lng } = data.geocodingResults[0].geometry.location;
          console.log(`Latitude: ${lat}, Longitude: ${lng}`);

          map.getView().setCenter(ol.proj.fromLonLat([lng, lat]));

          markers.forEach((marker) => map.removeOverlay(marker));
          markers = [];

          Object.keys(routes).forEach((cab, index) => {
            let cabMarkerElement = document.createElement("div");
            cabMarkerElement.className = "cab-marker";
            cabMarkerElement.innerHTML = "🚖";
            cabMarkerElement.style.fontSize = "24px";
            cabMarkerElement.style.fontWeight = "bold";
            cabMarkerElement.style.color =
              index === 0 ? "red" : index === 1 ? "blue" : "green";

            let cabMarker = new ol.Overlay({
              position: ol.proj.fromLonLat([
                routes[cab][0][0],
                routes[cab][0][1],
              ]),
              element: cabMarkerElement,
              positioning: "bottom-center",
            });

            map.addOverlay(cabMarker);
            markers.push(cabMarker);

            // Start moving the cab along the route
            moveCabAlongRoute(cabMarker, routes[cab]);
          });
        } else {
          console.error("No geocoding results found.");
        }
      })
      .catch((err) => console.error("Error fetching location:", err));
  }

  document
    .getElementById("searchBox")
    .addEventListener("input", (event) => fetchSuggestions(event.target.value));

  document.getElementById("searchBox").addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      searchLocation(event.target.value);
    }
  });

  document.getElementById("searchBtn").addEventListener("click", () => {
    const query = document.getElementById("searchBox").value;
    searchLocation(query);
  });

  initMap();
});
