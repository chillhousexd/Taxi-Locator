document.addEventListener("DOMContentLoaded", () => {
  let map;
  let markers = [];
  let polylines = [];
  let isFollowing = false;
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
      [85.043555, 25.583438],
      [85.043555, 25.583927],
      [85.043509, 25.584552],
      [85.043509, 25.585136],
      [85.043469, 25.586078],
      [85.043413, 25.586525],
      [85.043367, 25.587461],
      [85.043312, 25.587968],
      [85.043226, 25.588686],
      [85.043211, 25.589136],
      [85.043133, 25.590466],
      [85.043062, 25.591437],
      [85.042953, 25.593542],
      [85.042852, 25.595396],
      [85.042743, 25.597909],
      [85.04262, 25.599612],
      [85.042526, 25.601906],
      [85.042417, 25.604341],
      [85.042378, 25.605621],
      [85.042183, 25.609013],
      [85.042011, 25.611103],
      [85.041942, 25.613155],
      [85.041794, 25.616574],
      [85.041661, 25.618348],
      [85.041559, 25.620754],
      [85.041416, 25.622901],
      [85.041457, 25.623301],
      [85.041425, 25.623524],
      [85.04145, 25.623752],
      [85.041764, 25.623765],
      [85.041931, 25.623508],
      [85.041934, 25.623169],
      [85.041721, 25.623087],
      [85.041558, 25.622751],
      [85.041559, 25.622751],
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
    if (index >= route.length - 1) {
      if (!isReturning) {
        console.log("Cab reached the final destination! Returning to start...");
        moveCabAlongRoute(
          cabMarker,
          [...route].reverse(),
          0,
          duration,
          [],
          true
        );
      } else {
        // isReturning = true;
        // console.log(isReturning);
        console.log("Cab returned to the starting point!");
      }
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

      if (isFollowing) {
        map.getView().setCenter(ol.proj.fromLonLat([newLng, newLat]));
      }

      let deltaX = endLng - startLng;
      let deltaY = endLat - startLat;
      let angle = (Math.atan2(deltaY, -deltaX) * 180) / Math.PI - 90;

      if (isReturning) {
        angle += 360;
      }      

      let cabMarkerElement = cabMarker.getElement();
      if (cabMarkerElement) {
        cabMarkerElement.style.transform = `rotate(${angle}deg)`;
      }

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
            cabMarkerElement.innerHTML = `<img src="car-icon.png" class="cab-image" />`;
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
