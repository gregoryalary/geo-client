'use strict';

// Intialize the map and focus the France
var map;

new Vue({
  el: '#app',
  data: {
    regions: [],
    selectedRegion: null,
    departements: [],
    selectedDepartement: null,
    communes: [],
    selectedCommune: null,
    currentInformations: null,
    polyline: null
  },
  methods: {
    selectRegion(event) {
      // Reset the department and the commune
      this.selectedDepartement = null;
      this.selectedCommune = null;
      this.currentInformations = null;
      // Find the informations of the current region
      this.selectedRegion = {
        code: event.target.value,
        nom: this.regions.find((elt) => elt.code === event.target.value).nom
      };
    },
    selectDepartement(event) {
      // Reset the commune
      this.selectedCommune = null;
      this.currentInformations = null;
      // Find the informations of the current commune
      this.selectedDepartement = {
        code: event.target.value,
        nom: this.departements.find((elt) => elt.code === event.target.value).nom
      }
    },
    selectCommune(event) {
      this.currentInformations = null;
      this.selectedCommune = {
        code: event.target.value,
        nom: this.communes.find((elt) => elt.code === event.target.value).nom
      }
    }
  },
  watch: {
    selectedRegion: function () {
      // Get regions
      this.$http.get('https://geo.api.gouv.fr/regions/' + this.selectedRegion.code + '/departements?fields=nom,code').then(response => {
        this.departements = response.body;
        document.getElementById('select-departement').selectedIndex = 0;
      });
      // Reset the commune list because the department has been reseted too
      this.communes = [];
    },
    selectedDepartement: function () {
      // Get communes
      if (this.selectedDepartement != null) { // guard in case the watch has been trigerred because of a reset
        this.$http.get('https://geo.api.gouv.fr/departements/' + this.selectedDepartement.code + '/communes?fields=nom,code').then(response => {
          this.communes = response.body;
          document.getElementById('select-commune').selectedIndex = 0;
        });
      }
    },
    selectedCommune: function () {
      if (this.selectedCommune != null) { // guard in case the watch has been trigerred because of a reset
        this.$http.get('https://geo.api.gouv.fr/communes/' + this.selectedCommune.code + '?fields=nom,code,codesPostaux,centre,surface,contour,codeDepartement,departement,codeRegion,region,population&format=json&geometry=centre').then(response => {
          this.currentInformations = response.body;
          if (this.polyline != null) { // Remove the polyline if a previous line exist
            map.removeLayer(this.polyline);
          }
          this.polyline = new L.Polyline(this.currentInformations.contour.coordinates[0].map(c => {
            return c.reverse(); // The api return [lng, lat] and we need [lat, lng]
          }), {
            color: 'red',
            fill: true,
            weight: 3,
            opacity: 0.5,
            smoothFactor: 1
          });
          this.polyline.addTo(map); 
          // Set the map bound to the commune
          map.flyToBounds(this.polyline.getBounds(), {
            duration: 3
          });
        });
      }
    }
  },
  mounted() {
    map = L.map('map', {
      center: [47.82, 2.61],
      zoom: 5,
      zoomControl: false
    });
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    map.touchZoom.disable();
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
    map.dragging.disable();
  },
  beforeMount() {
    // load regions
    this.$http.get('https://geo.api.gouv.fr/regions?fields=nom,code').then(response => {
      this.regions = response.body;
    }, response => {
      alert('Can\'t load the data');
    });
  }
});