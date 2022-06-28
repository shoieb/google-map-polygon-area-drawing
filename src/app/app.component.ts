import { Component, OnInit } from '@angular/core';

declare const google: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  title = 'google-map-polygon-area-drawing';

  readonly metaData: any = {
    fillColors: ['#623FC4', '#DF3776', '#A2CE76'],
    strokeColors:['#BDA96B', '#ACA9A2', '#E63737']
  };

  public maxDrawLimit: number = 3;
  public lat: number = 20.5937;
  public lng: number = 78.9629;
  public selectedShape: any = null;
  public drawnAreas: any[] = [];

  private _drawingManager: any = null;

  constructor() {}

  ngOnInit() {
    this._setCurrentPosition();
  }

  onMapReady(map: any) {
    this._initDrawingManager(map);
  }

  addNewArea(): void {
    this._drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    this._drawingManager.setOptions({
      drawingControl: true,
      drawingControlOptions: {
        drawingModes: [google.maps.drawing.OverlayType.POLYGON],
      },
      polygonOptions: {
        strokeColor: this.metaData.strokeColors[this.drawnAreas.length],
        strokeOpacity: 0.8,
        strokeWeight: 3,
        fillColor: this.metaData.fillColors[this.drawnAreas.length],
        fillOpacity: 0.35,
        name: `area_${new Date().getTime()}`
      },
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
    });
  }

  deleteSelectedArea(): void {
    if (this.selectedShape) {
      let index = this.drawnAreas.findIndex(a => a.name === this.selectedShape.name);
      if (index !== -1) {
        this.drawnAreas[index].labelMarker.setMap(null);
        this.drawnAreas.splice(index, 1);
      }
      this.selectedShape.setMap(null);
      this.selectedShape = null;
      this._disableDrawingManager();
    }
  }

  getTotalArea() {
    let totalArea = this.drawnAreas.reduce((accumulator, area) => {
      let calculatedArea = google.maps.geometry.spherical.computeArea(area.polygon.getPath()).toFixed(2);
      let sum = accumulator + Number(calculatedArea);
      return sum;
    }, 0);
    return `${totalArea} sqm / ${(totalArea/10000).toFixed(2)} hectares`;
  }

  private _initDrawingManager = (map: any) => {
    const options = {
      drawingControl: true,
      drawingControlOptions: {
        drawingModes: [google.maps.drawing.OverlayType.POLYGON],
      },
      polygonOptions: {
        strokeColor: this.metaData.strokeColors[this.drawnAreas.length],
        strokeOpacity: 0.8,
        strokeWeight: 3,
        fillColor: this.metaData.fillColors[this.drawnAreas.length],
        fillOpacity: 0.35,
        name: `area_${new Date().getTime()}`
      },
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
    };
    this._drawingManager = new google.maps.drawing.DrawingManager(options);
    this._drawingManager.setMap(map);
    google.maps.event.addListener(this._drawingManager, 'overlaycomplete', (event: any) => {
        if (event.type === google.maps.drawing.OverlayType.POLYGON) {
          const paths = event.overlay.getPaths();
          for (let p = 0; p < paths.getLength(); p++) {
            google.maps.event.addListener(paths.getAt(p), 'set_at', () => {
                if (!event.overlay.drag) {
                  this._updateLabelObject(event.overlay, map);
                }
              }
            );
            google.maps.event.addListener(paths.getAt(p), 'insert_at', () => {
                this._updateLabelObject(event.overlay, map);
              }
            );
            google.maps.event.addListener(paths.getAt(p), 'remove_at', () => {
                this._updateLabelObject(event.overlay, map);
              }
            );
          }
          this.drawnAreas.push({
            name: event.overlay.name,
            polygon: event.overlay,
            type: event.type,
            labelMarker: this._getLabelObject(event.overlay)
          });
          this._updateLabelObject(event.overlay, map);
          google.maps.event.addListener(event.overlay, 'click', () => {
              if (this.selectedShape){
                this.selectedShape.setOptions({
                  editable: false
                });
              }
              this.selectedShape = event.overlay;
              this.selectedShape.type = event.type;
              this.selectedShape.setOptions({
                editable: true
              });
            }
          );
        }
        if (event.type !== google.maps.drawing.OverlayType.MARKER) {
          this._disableDrawingManager();
        }
      }
    );
  }

  private _disableDrawingManager(): void {
    this._drawingManager.setDrawingMode(null);
    this._drawingManager.setOptions({
      drawingControl: false,
    });
  }

  private _setCurrentPosition(): void {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.lat = position.coords.latitude;
        this.lng = position.coords.longitude;
      });
    }
  }

  private _updateLabelObject(area: any, map: any): void {
    let index = this.drawnAreas.findIndex(a => a.name === area.name);
    if (index !== -1) {
      this.drawnAreas[index].labelMarker.setMap(null);
      this.drawnAreas[index].labelMarker = null;
      this.drawnAreas[index].labelMarker = this._getLabelObject(area);
      this.drawnAreas[index].labelMarker.setMap(map);
    }
  }

  private _getLabelObject(area: any): void {
    const path = area.getPath();
    const tempBounds = new google.maps.LatLngBounds();
    const len = path.getLength();
      for (let i = 0; i < len; i++) {
        let p = path.getAt(i).toJSON();
        const x = {
          lat: p.lat,
          lng: p.lng,
        };
        const BoundLatLng = new google.maps.LatLng({
          lat: parseFloat(x.lat),
          lng: parseFloat(x.lng),
        });
        tempBounds.extend(BoundLatLng);
      }
      const centroid = tempBounds.getCenter();

      let areaInSqm = google.maps.geometry.spherical.computeArea(path).toFixed(2);

      const markerLabel = new google.maps.Marker({
        position: centroid,
        label:{
          text: `${areaInSqm} sqm / ${(areaInSqm/10000).toFixed(2)} hectares`,
          color: 'white'
        },
        icon: "https://ibb.co/cJpsnpb"
      });
      return markerLabel;
  }

}
