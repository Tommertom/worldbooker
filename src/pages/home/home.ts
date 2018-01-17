import { TimeslotPage } from './../timeslot/timeslot';
import { NavController, PopoverController, AlertController, ModalController, Platform, ActionSheetController, ToastController } from 'ionic-angular';

import { Component } from '@angular/core';

import { ListPage } from '../list/list';
import { ConfigPage } from '../config/config';

import { Area, TimeZoneProvider } from './../../providers/timezone.provider';
import { Storage } from '@ionic/storage';

const hourInMilSecs = (60 * 60 * 1000) / 2;
const scrollPageSize = 60;

/*
  tijd instellen
  tijd in halve/hele uren
  underscore in namen cities aanpassen 
  namen variables
  documentatie functies
   commentaarteksten begin van files
  icons en logo
  sharing of ICS
  deeplinking
*/

export interface DisplayLine {
  areas: Array<AreaDisplay>;
  overall_score: number;
}

export interface AreaDisplay {
  area_name: string;
  area_city: string;
  area_city_short: string;
  time_number: number;
  time_string: string;
  backgroundcolor: string;
  nice_code: number;
  time_string_short: string;
}


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  items: Array<DisplayLine> = [];
  itemsInView: Array<DisplayLine> = [];

  selectedAreas: Array<AreaDisplay> = [];
  possibleAreas: Array<Area> = [];
  earlierSelectedAreas: Array<Area> = [];

  scoreFilter: number = 0;
  now: number = 0;

  isPortrait: boolean = true;

  constructor(
    private toastCtrl: ToastController,
    private modalCtrl: ModalController,
    private navCtrl: NavController,
    private actionsheetCtrl: ActionSheetController,
    private timezoneProvider: TimeZoneProvider,
    private storage: Storage,
    private platform: Platform,
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

    this.platform.ready()
      .then(() => {
        this.isPortrait = this.platform.isPortrait()
      })
  }

  ionViewDidEnter() {
    window.addEventListener("orientationchange", () => {
      if (this.platform.isLandscape()) {
        // console.log('IsLandscape')
        this.isPortrait = false;
      }
      else if (this.platform.isPortrait()) {
        //  console.log('IsPortrait')
        this.isPortrait = true;
      }
    }, false);
  }

  refreshLinesOnScore() {
    this.itemsInView = this.items.filter(item => {
      return item.overall_score > this.scoreFilter
    })
  }

  doToast(message) {
    let toast = this.toastCtrl.create({
      message: message,
      duration: 2000,
      //position: position
    }).present();
  }

  getNiceCode(timezone: string, date: Date) {
    let time: string = "";

    time = new Intl.DateTimeFormat('en-US', {
      //  year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric',// second: 'numeric',
      hour12: false,
      timeZone: timezone
    }).format(date);

    time = time.replace(':', '');
    let timenumber: number = Number(time);

    let returnCode = 0;
    if (timenumber <= 630) returnCode = 2;
    if ((timenumber >= 600) && (timenumber < 730)) returnCode = 1;
    if ((timenumber >= 1700) && (timenumber < 1830)) returnCode = 1;
    if (timenumber >= 1830) returnCode = 2;

    return returnCode;
  }

  addTimeLine() {
    let time = new Date(this.now + this.items.length * hourInMilSecs);

    if (this.items.length == 0) {
      let minutes = new Date(this.now).getMinutes();
      if (minutes < 30) this.now = new Date(this.now - (minutes * 60 * 1000)).getTime()
      if (minutes > 30) this.now = new Date(this.now + ((60 - minutes) * 60 * 1000)).getTime()
    }

    let lineItem: Array<AreaDisplay> = [];
    let overallScore = 0;
    this.selectedAreas.map(area => {

      let area_name = area.area_name;

      try {
        let niceCode: number = 0;
        if (area_name == 'undefined') niceCode = -1
        else niceCode = this.getNiceCode(area_name, time)

        let backColor = '#2ECC40';
        if (niceCode == 1) backColor = '#FF851B';
        if (niceCode == 2) backColor = '#FF4136';

        if (niceCode == -1) lineItem.push({
          area_name: area.area_name,
          area_city: area.area_city,
          area_city_short: '',
          time_number: 0,
          time_string: '',
          time_string_short: '',
          backgroundcolor: 'white',
          nice_code: 0
        })
        else lineItem.push({
          area_name: area.area_name,
          area_city: area.area_city,
          area_city_short: area.area_city.substring(0, 3).toUpperCase(),
          time_number: time.getTime(),
          time_string: this.timezoneProvider.getTimeStringLong(area_name, time),
          time_string_short: this.timezoneProvider.getTimeStringShort(area_name, time),
          backgroundcolor: backColor,
          nice_code: niceCode,
        })

        overallScore += niceCode;
      }
      // we have found an illegal timezone
      catch (err) {
        //console.log('PRUT ', err)
        lineItem.push({
          area_name: area.area_name,
          area_city: area.area_city,
          area_city_short: '',
          time_number: 0,
          time_string: '',
          time_string_short: '',
          backgroundcolor: 'white',
          nice_code: 0
        })
      }
      finally {
      }
    })

    // console.log('THIS ITEMS', this.items)
    overallScore = Math.round(100 - (100 * (overallScore / (lineItem.length * 2))));

    this.items.push({ overall_score: overallScore, areas: lineItem });
  }

  changeArea(area) {
    let popover = this.modalCtrl.create(ListPage, { earlierSelectedAreas: this.earlierSelectedAreas, allAreas: this.possibleAreas }, {
      showBackdrop: true,
      enableBackdropDismiss: true
    });

    popover.onDidDismiss(data => {
      if (data) {
        //console.log(' GETTING DATA', data);

        area.area_name = data['area_name'];
        area.area_city = data['area_city'];
        area.area_city_short = <string>area.area_city.substring(0, 3).toUpperCase();

        if (area.area_name != 'undefined')
          if (this.earlierSelectedAreas.filter((areaItem => { return areaItem.area_name == area.area_name })).length == 0) {
            //console.log('ADASDSADAS', data, area)
            this.earlierSelectedAreas.push(area);
            this.saveSettings();
          }

        //console.log('selectedAreas', this.selectedAreas, this.earlierSelectedAreas);
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

  openMeetingLine(meetingLine) {
    //  console.log('MEETTTTTT', meetingLine)
    //    let modal = this.popoverCtrl.create(TimeslotPage, {
    //     displayLine: meetingLine
    //   });

    // modal.present();


    let actionSheet = this.actionsheetCtrl.create({
      //title: 'Actions for timeline',
      buttons: [
        {
          text: 'Share URL',
          //role: 'destructive',
          //  icon: !this.platform.is('ios') ? 'trash' : null,
          handler: () => {
            //    console.log('Delete clicked');
            if (document.queryCommandSupported('copy')) {
              console.log('YESSSS')
//https://medium.com/coding-snippets/copy-to-clipboard-with-ionic-2-6c31356c008
            }
            this.doToast('URL copied to clipboard');
          }
        },
        {
          text: 'Share vCal',
          //icon: !this.platform.is('ios') ? 'share' : null,
          handler: () => {
            this.doToast('vCal clicked');
          }
        },
        {
          text: 'Change startdate',
          //icon: !this.platform.is('ios') ? 'share' : null,
          handler: () => {
            this.doToast('Change startdate');
          }
        },
        {
          text: 'Cancel',
          role: 'cancel', // will always sort to be on the bottom
          icon: !this.platform.is('ios') ? 'close' : null,
          handler: () => {
            console.log('Cancel clicked');
          }
        }
      ]
    });
    actionSheet.present();


  }

  openSettings(currentnice_code: number) {

    let modal = this.modalCtrl.create(ConfigPage, {
      scoreFilter: this.scoreFilter,
      earlierSelectedAreas: this.earlierSelectedAreas
    });

    modal.onDidDismiss(data => {
      if (data) {
        this.scoreFilter = data['scoreFilter'];
        this.earlierSelectedAreas = data['earlierSelectedAreas']

        this.saveSettings();

        this.refreshLinesOnScore()
      }
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


            this.selectedAreas = [];
            //console.log('LOADED SELECETED AREAS', val, this.selectedAreas)

            // migration
            /*            if (this.selectedAreas)
                          this.selectedAreas.map(area => {
                            if (typeof area.area_city_short == 'undefined')
                              area.area_city_short = area.area_city.substring(0, 3).toUpperCase();
                          })
            */
            //
            if (this.selectedAreas.length == 0) {
              this.selectedAreas = [{
                area_name: 'Europe/Amsterdam',
                area_city: 'Amsterdam',
                area_city_short: 'AMS',
                time_number: 0,
                time_string: '',
                time_string_short: '',
                backgroundcolor: 'white',
                nice_code: 0
              },
              {
                area_name: 'America/Anguilla',
                area_city: 'Anguilla',
                area_city_short: 'ANG',
                time_number: 0,
                time_string: '',
                time_string_short: '',
                backgroundcolor: 'white',
                nice_code: 0
              },

              {
                area_name: 'America/Argentina/Jujuy',
                area_city: 'Jujuy',
                area_city_short: 'JUJ',
                time_number: 0,
                time_string: '',
                time_string_short: '',
                backgroundcolor: 'white',
                nice_code: 0
              },
              {
                area_name: 'undefined',
                area_city: 'undefined',
                area_city_short: '',
                time_number: 0,
                time_string: '',
                time_string_short: '',
                backgroundcolor: 'white',
                nice_code: 0
              }
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
