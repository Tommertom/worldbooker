
import { Component } from '@angular/core';
import { NavController, PopoverController, AlertController } from 'ionic-angular';

import { ListPage } from '../list/list';
import { TimeZoneProvider } from './../../providers/timezone.provider';
import { Storage } from '@ionic/storage';

const hourInMilSecs = 60 * 60 * 1000;

const scrollPageSize = 60;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  items = [];
  itemsInView = [];

  now = 0;
  selectedAreas = [];
  possibleAreas = [];

  scoreFilter: number = 0;

  constructor(
    public navCtrl: NavController,
    private alertCtrl: AlertController,
    private timezoneProvider: TimeZoneProvider,
    private storage: Storage,
    private popoverCtrl: PopoverController) {

    this.timezoneProvider.getZones()
      .then(value => {
        let zones: any;
        zones = value;

        this.possibleAreas = [];
        zones.map(zone => {

          this.possibleAreas.push({
            area_name: zone['zone_name'],
            city: zone['zone_name'].split('/').pop()
          })
        });
      })

    this.now = Date.now();

    this.storage.ready()
      .then(() => {

        this.storage.get('selectedAreas')
          .then(val => {
            if (val) {
              this.selectedAreas = val;
            } else this.selectedAreas = [
              { area_name: 'Europe/Amsterdam', city: 'Amsterdam' },
              { area_name: 'Asia/Singapore', city: 'Singapore' },
              { area_name: 'America/St_Barthelemy', city: 'St_Barthelemy' },
              { area_name: 'Europe/Volgograd', city: 'Volgograd' }
            ];
          })
          .then(() => {
            for (let i = 0; i < scrollPageSize; i++)
              this.addTimeLine();

            this.refreshLinesOnScore();
          })

      })

    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
  }


  refreshLinesOnScore() {
    this.itemsInView = this.items.filter(item => {
      return item['overallScore'] > this.scoreFilter
    })
  }

  getTimeString(timezone: string, date: Date) {
    return new Intl.DateTimeFormat('en-GB', {
      hour: 'numeric', minute: 'numeric', // second: 'numeric',
      weekday: 'short', month: 'short', day: 'numeric', //year: 'numeric',
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
        time_number: time,
        time_string: this.getTimeString(area_name, time),
        backgroundcolor: backColor, //this.getBackColor(area, time),
        nicecode: niceCode
      })

      overallScore += niceCode;
    })

    overallScore = Math.round(100 - (100 * (overallScore / (lineItem.length * 2))));

    this.items.push({ overallScore: overallScore, gridColumns: lineItem });
  }

  updateTimeLines(areaToRefresh) {

    let lineItem = [];
    this.items.map(itemrow => {

      let overallScore = 0;
      lineItem = itemrow['gridColumns'];

      lineItem
        .map(area => {
          let niceCode = area['nicecode'];
          overallScore = 0;

          if (area['area']['city'] == areaToRefresh['city']) {

            niceCode = this.getNiceCode(area['area']['area_name'], area['time_number'])

            let backColor = 'green';
            if (niceCode == 1) backColor = 'orange';
            if (niceCode == 2) backColor = 'red';

            area = Object.assign(area,
              {
                backgroundcolor: backColor,
                nicecode: niceCode
              })
          }

          overallScore += niceCode;
        })

      overallScore = Math.round(100 - (100 * (overallScore / (lineItem.length * 2))));

      itemrow['overallScore'] = overallScore;
    })



    this.refreshLinesOnScore();

  }

  doCheckbox() {
    let alert = this.alertCtrl.create();
    alert.setTitle('Select score filter');

    alert.addInput({
      type: 'checkbox',
      label: '>75%',
      value: '75',
      checked: true
    });

    alert.addInput({
      type: 'checkbox',
      label: '>50%',
      value: '50'
    });

    alert.addInput({
      type: 'checkbox',
      label: '>25%',
      value: '25'
    });

    alert.addInput({
      type: 'checkbox',
      label: 'all',
      value: '0'
    });

    alert.addButton('Cancel');
    alert.addButton({
      text: 'Okay',
      handler: data => {
        console.log('Checkbox data:', data);

        if (data) {
          let lowest = 100;
          data.map(value => {
            if (Number(value) < lowest)
              lowest = Number(value);
          })

          this.scoreFilter = lowest;
        }

        this.refreshLinesOnScore()
      }
    });
    alert.present().then(() => {
    });
  }


  changeArea(area) {
    console.log('AAREE', area)

    let popover = this.popoverCtrl.create(ListPage, { preferredAreas: [], allAreas: this.possibleAreas }, {
      showBackdrop: true,
      enableBackdropDismiss: true
    });

    popover.onDidDismiss(data => {
      console.log('Recevied data', data, area)

      if (data) {
        area['area_name'] = data['area_name']
        area['city'] = data['city'];

        this.updateTimeLines(area);

        this.storage.set('selectedAreas', this.selectedAreas);
      }
    })
    popover.present({});

  }

  doInfinite(infiniteScroll) {
    setTimeout(() => {
      for (let i = 0; i < scrollPageSize; i++) {
        this.addTimeLine();
      }

      this.refreshLinesOnScore();

      infiniteScroll.complete();
    }, 1);
  }
}
