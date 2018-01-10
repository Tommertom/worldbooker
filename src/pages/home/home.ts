import { TimeZoneProvider } from './../../providers/timezone.provider';
import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

const hourInMilSecs = 60 * 60 * 1000;

const scrollPageSize = 60;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  items = [];
  zoneList = [];
  now = 0;
  selectedAreas = [];


  constructor(public navCtrl: NavController, private timezoneProvider: TimeZoneProvider) {

    this.zoneList = [];
    let zones: Array<Object> = this.timezoneProvider.getZones();
    zones.map(zone => {
      this.zoneList.push(zone['zone_name'])
    });

    this.now = Date.now();
    this.selectedAreas = ['Europe/Amsterdam', 'Asia/Singapore', 'America/St_Barthelemy', 'Europe/Volgograd'];

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

      let niceCode = this.getNiceCode(area, time)

      let backColor = 'green';
      if (niceCode == 1) backColor = 'orange';
      if (niceCode == 2) backColor = 'red';

      lineItem.push({
        area: area,
        time: this.getTimeString(area, time),
        backgroundcolor: backColor, //this.getBackColor(area, time),
        nicecode: niceCode
      })

      overallScore += niceCode;
    })

    overallScore = Math.round(100 - (100 * (overallScore / (lineItem.length * 2))));

    this.items.push({ overallScore: overallScore, gridColumns: lineItem });
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
