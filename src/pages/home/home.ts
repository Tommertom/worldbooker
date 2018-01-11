
import { Component } from '@angular/core';
import { NavController, PopoverController } from 'ionic-angular';

import { ListPage } from '../list/list';
import { TimeZoneProvider } from './../../providers/timezone.provider';



const hourInMilSecs = 60 * 60 * 1000;

const scrollPageSize = 60;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  items = [];

  now = 0;
  selectedAreas = [];
  possibleAreas = [];

  constructor(public navCtrl: NavController,
    private timezoneProvider: TimeZoneProvider,
    private popoverCtrl: PopoverController) {

    this.timezoneProvider.getZones()
      .then(value => {
        let zones: any;
        zones = value;

        this.possibleAreas = [];
        zones.map(zone => {
          //   console.log('zone', zone.split('/'))
          this.possibleAreas.push({
            area_name: zone['zone_name'],
            city: zone['zone_name'].split('/').pop()
          })
        });
        //console.log('ZONES', zones, this.possibleAreas);
      })

    this.now = Date.now();
    this.selectedAreas = [
      { area_name: 'Europe/Amsterdam', city: 'Amsterdam' },
      { area_name: 'Asia/Singapore', city: 'Singapore' },
      { area_name: 'America/St_Barthelemy', city: 'St_Barthelemy' },
      { area_name: 'Europe/Volgograd', city: 'Volgograd' }
    ];

    for (let i = 0; i < scrollPageSize; i++) {
      this.addTimeLine();
    }

    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
  }

  getTimeString(timezone: string, date: Date) {
    return new Intl.DateTimeFormat('en-GB', {
      hour: 'numeric', minute: 'numeric',
      second: 'numeric', weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      timeZone: timezone
    }).format(date);
  }


  getBackColor(timezone: string, date: Date) {

    let time: string = new Intl.DateTimeFormat('en-US', {
      //  year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric',// second: 'numeric',
      hour12: false,
      timeZone: timezone
    }).format(date);

    time = time.replace(':', '');
    let timenumber: number = Number(time);

    let returnColor = 'green';

    if (timenumber < 630) returnColor = 'red';
    if ((timenumber > 600) && (timenumber < 730)) returnColor = "orange";
    if ((timenumber > 1700) && (timenumber < 1830)) returnColor = "orange";
    if (timenumber > 1830) returnColor = 'red';

    return returnColor;
  }

  getNiceCode(timezone: string, date: Date) {

    let time: string = new Intl.DateTimeFormat('en-US', {
      //  year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric',// second: 'numeric',
      hour12: false,
      timeZone: timezone
    }).format(date);

    time = time.replace(':', '');
    let timenumber: number = Number(time);

    let returnCode = 0;
    if (timenumber < 630) returnCode = 2;
    if ((timenumber > 600) && (timenumber < 730)) returnCode = 1;
    if ((timenumber > 1700) && (timenumber < 1830)) returnCode = 1;
    if (timenumber > 1830) returnCode = 2;

    return returnCode;
  }

  addTimeLine() {
    let time = new Date(this.now + this.items.length * hourInMilSecs);

    let lineItem = [];
    let overallScore = 0;
    this.selectedAreas.map(area => {

      let area_name = area['area_name'];

      let niceCode = this.getNiceCode(area_name, time)

      let backColor = 'green';
      if (niceCode == 1) backColor = 'orange';
      if (niceCode == 2) backColor = 'red';

      lineItem.push({
        area: area,
        time: this.getTimeString(area_name, time),
        backgroundcolor: backColor, //this.getBackColor(area, time),
        nicecode: niceCode
      })

      overallScore += niceCode;
    })

    overallScore = Math.round(100 - (100 * (overallScore / (lineItem.length * 2))));

    this.items.push({ overallScore: overallScore, gridColumns: lineItem });
  }

  changeArea(area) {
    // console.log('AAREE', area)

    let popover = this.popoverCtrl.create(ListPage, { preferredAreas: [], allAreas: this.possibleAreas }, {
      showBackdrop: true,
      enableBackdropDismiss: true
    });

    popover.onDidDismiss(data => {
      console.log('Recevied data', data)

      if (data) {

      }
    })
    popover.present({});

  }

  doInfinite(infiniteScroll) {
    //console.log('Begin async operation', infiniteScroll);

    setTimeout(() => {
      for (let i = 0; i < scrollPageSize; i++) {
        this.addTimeLine();
      }

      // console.log('Async operation has ended');
      infiniteScroll.complete();
    }, 10);
  }
}
