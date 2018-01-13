import { Component } from '@angular/core';
import { NavController, PopoverController, AlertController, ModalController } from 'ionic-angular';

import { ListPage } from '../list/list';
import { ConfigPage } from '../config/config';

import { TimeZoneProvider } from './../../providers/timezone.provider';
import { Storage } from '@ionic/storage';

const hourInMilSecs = (60 * 60 * 1000) / 2;
const scrollPageSize = 60;

export interface DisplayLine {
  areas: Array<AreaDisplay>;
  overall_score: number;
}

export interface AreaDisplay {
  area_name: string;
  area_city: string;
  time_number: Date;
  time_string: string;
  backgroundcolor: string;
  nice_code: number;
}

export interface Area {
  area_name: string;
  area_city: string;
}

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  items: Array<DisplayLine> = [];
  itemsInView: Array<DisplayLine> = [];

  selectedAreas: Array<Area> = [];
  possibleAreas: Array<Area> = [];
  earlierSelectedAreas: Array<Area> = [];

  scoreFilter: number = 0;
  now = 0;

  constructor(
    private modalCtrl: ModalController,
    public navCtrl: NavController,
    //    private alertCtrl: AlertController,
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
            area_city: zone['zone_name'].split('/').pop()
          })
        });
      })

    this.now = Date.now();

    this.loadSettings();

    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
  }

  refreshLinesOnScore() {
    this.itemsInView = this.items.filter(item => {
      return item.overall_score > this.scoreFilter
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

    let lineItem: Array<AreaDisplay> = [];
    let overallScore = 0;
    this.selectedAreas.map(area => {

      let area_name = area['area_name'];

      try {
        let niceCode = this.getNiceCode(area_name, time)

        let backColor = 'green';
        if (niceCode == 1) backColor = 'orange';
        if (niceCode == 2) backColor = 'red';

        lineItem.push({
          area_name: area.area_name,
          area_city: area.area_city,
          time_number: time,
          time_string: this.getTimeString(area_name, time),
          backgroundcolor: backColor, //this.getBackColor(area, time),
          nice_code: niceCode
        })

        overallScore += niceCode;
      }
      catch (err) {
        lineItem.push({
          area_name: area.area_name,
          area_city: area.area_city,
          time_number: time,
          time_string: '',
          backgroundcolor: 'white', //this.getBackColor(area, time),
          nice_code: 0
        })
      }
      finally {
      }
    })

    overallScore = Math.round(100 - (100 * (overallScore / (lineItem.length * 2))));

    this.items.push({ overall_score: overallScore, areas: lineItem });
  }

  changeArea(area) {

    let popover = this.popoverCtrl.create(ListPage, { earlierSelectedAreas: this.earlierSelectedAreas, allAreas: this.possibleAreas }, {
      showBackdrop: true,
      enableBackdropDismiss: true
    });

    popover.onDidDismiss(data => {
      if (data) {


        area.area_name = data['area_name'];
        area.area_city = data['area_city'];

        if (area.area_name != 'undefined')
          if (this.earlierSelectedAreas.filter((areaItem => { return areaItem.area_name == area.area_name })).length == 0) {
            this.earlierSelectedAreas.push(area);
            this.saveSettings();
          }

        console.log('selectedAreas', this.selectedAreas, this.earlierSelectedAreas);

        this.updateTimeLines();

        this.saveSettings();
      }
    })
    popover.present({});

  }


  updateTimeLines() {

    let itemCount = this.items.length;
    this.items = [];

    for (let i = 0; i < itemCount; i++)
      this.addTimeLine();
    this.refreshLinesOnScore();
  }

  openSettings(currentnice_code: number) {

    let modal = this.modalCtrl.create(ConfigPage, {
      scoreFilter: this.scoreFilter,
      earlierSelectedAreas: this.earlierSelectedAreas
    });

    modal.onDidDismiss(data => {
      if (data) {

        console.log('RECEIVED DATA', data)
        this.scoreFilter = data['scoreFilter'];
        this.earlierSelectedAreas = data['earlierSelectedAreas']

        /*
                let lowest = 100;
                data.map(value => {
                  if (Number(value) < lowest)
                    lowest = Number(value);
                })
                this.scoreFilter = lowest;
        */
      }

      this.refreshLinesOnScore()
    })
    modal.present();
  }

  doInfinite(infiniteScroll) {
    setTimeout(() => {
      for (let i = 0; i < scrollPageSize; i++)
        this.addTimeLine();

      this.refreshLinesOnScore();

      infiniteScroll.complete();
    }, 1);
  }

  saveSettings() {
    this.storage.set('selectedAreas', this.selectedAreas);
    this.storage.set('earlierSelectedAreas', this.earlierSelectedAreas);
  }

  loadSettings() {

    this.storage.ready()
      .then(() => {

        this.storage.get('earlierSelectedAreas')
          .then(val => {
            if (val)
              this.earlierSelectedAreas = val
            else this.earlierSelectedAreas = [];
          })

        this.storage.get('selectedAreas')
          .then(val => {

            this.selectedAreas = [];

            if (val != null)
              this.selectedAreas = val;

            //this.selectedAreas = [];

            if (this.selectedAreas.length == 0) {
              this.selectedAreas = [
                { area_name: 'Europe/Amsterdam', area_city: 'Amsterdam' },
                { area_name: 'Asia/Singapore', area_city: 'Singapore' },
                { area_name: 'America/St_Barthelemy', area_city: 'St_Barthelemy' },
                { area_name: 'Europe/Volgograd', area_city: 'Volgograd' }
              ];

              this.saveSettings();
            }
          })
          .then(() => {
            for (let i = 0; i < scrollPageSize; i++)
              this.addTimeLine();

            this.refreshLinesOnScore();
          })
      })
  }
}
