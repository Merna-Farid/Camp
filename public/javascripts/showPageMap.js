
const maptilerApiKey = mapKey
maptilersdk.config.apiKey = maptilerApiKey;
const map = new maptilersdk.Map({
  container: 'map', 
  style: maptilersdk.MapStyle.STREETS,
  center:camp.geometry.coordinates,
  zoom: 14,
});

new maptilersdk.Marker()
.setLngLat(camp.geometry.coordinates)
.setPopup(
    new maptilersdk.Popup({ offset: 25 })
        .setHTML(
            `<h3>${camp.title}</h3><p>${camp.location}</p>`
        )
)
.addTo(map)