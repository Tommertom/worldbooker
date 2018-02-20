import { PopoverController, AlertController, ModalController, Platform, ActionSheetController, ToastController } from 'ionic-angular';
import { Component } from '@angular/core';

import { ListPage } from '../list/list';
import { ConfigPage } from '../config/config';
import { TimeslotPage } from './../timeslot/timeslot';

import { Area, TimeZoneProvider } from './../../providers/timezone.provider';
import { Storage } from '@ionic/storage';

const hourInMilSecs = (60 * 60 * 1000) / 2;
const scrollPageSize = 60;

/*
  tijd instellen
  tijd in halve/hele uren
  underscore in namen cities aanpassen 
  icons en logo
  sharing of ICS
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

  // key values to build the view in the app
  items: Array<DisplayLine> = [];
  itemsInView: Array<DisplayLine> = [];
  selectedAreas: Array<AreaDisplay> = []; // the areas selected in the top row of the app
  now: number = 0; // the starting time for the view

  // variables for the selection of areas in the top row
  possibleAreas: Array<Area> = []; // overview of potential areas (name/region)
  earlierSelectedAreas: Array<Area> = [];

  // view related parameters
  isPortrait: boolean = true;
  scoreFilter: number = 0;

  // for the copy/paste action
  clipboard: any;
  txtToCopy: string = "copytext";

  constructor(
    private toastCtrl: ToastController,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
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

    let queryDate = this.platform.getQueryParam('now');
    if (queryDate != undefined) this.now = Number(queryDate)
    else this.now = Date.now();

    this.platform.ready()
      .then(() => {
        this.loadSettings();
        this.isPortrait = this.platform.isPortrait();
      })
  }

  ionViewDidEnter() {
    window.addEventListener("orientationchange", () => {
      this.isPortrait = this.platform.isPortrait();
    }, false);
  }

  filterLinesUsingScore() {
    this.itemsInView = this.items.filter(item => {
      return item.overall_score >= this.scoreFilter
    })
  }

  doToast(message) {
    this.toastCtrl.create({
      message: message,
      duration: 2000
    }).present();
  }

  getNiceCode(timezone: string, date: Date) {
    let time: string = "";

    time = new Intl.DateTimeFormat('en-US', {
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
    // let's round the first entry to nearest whole/half
    if (this.items.length == 0) {
      let minutes = new Date(this.now).getMinutes();
      if (minutes < 30) this.now = new Date(this.now - (minutes * 60 * 1000)).getTime()
      if (minutes > 30) this.now = new Date(this.now + ((60 - minutes) * 60 * 1000)).getTime()
    }

    // what will be the time to use for this line
    let time = new Date(this.now + this.items.length * hourInMilSecs);

    // we are going to fill the line, but first it is empty
    let lineItem: Array<AreaDisplay> = [];

    // the counters for the score
    let totallinescore = 0;
    let validareascount = 0;

    // let's go through all selected areas 
    this.selectedAreas.map(area => {

      let area_name = area.area_name;
      try {
        let niceCode: number = 0;
        if (area_name == 'undefined') niceCode = -1
        else niceCode = this.getNiceCode(area_name, time)

        // try to define the color for the cell
        let backColor = '#2ECC40';
        if (niceCode == 1) backColor = '#FF851B';
        if (niceCode == 2) backColor = '#FF4136';

        // add the item, if there is a valid one (blank or colored)
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
        else {
          // add the valid item
          lineItem.push({
            area_name: area.area_name,
            area_city: area.area_city,
            area_city_short: area.area_city.substring(0, 3).toUpperCase(),
            time_number: time.getTime(),
            time_string: this.timezoneProvider.getTimeStringLong(area_name, time),
            time_string_short: this.timezoneProvider.getTimeStringShort(area_name, time),
            backgroundcolor: backColor,
            nice_code: niceCode,
          })

          // change the count
          validareascount += 1;
          totallinescore += niceCode;
        }
      }
      // we have found an illegal timezone, which will just lead to an empty cell
      catch (err) {
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
    })

    // add the item to the table
    this.items.push({
      overall_score: Math.round(100 - (100 * (totallinescore / (validareascount * 2)))), // 2 is max score
      areas: lineItem
    });
  }

  changeArea(area) {
    let modal = this.modalCtrl.create(ListPage, { earlierSelectedAreas: this.earlierSelectedAreas, allAreas: this.possibleAreas });

    modal.onDidDismiss(data => {
      if (data) {
        area.area_name = data['area_name'];
        area.area_city = data['area_city'];
        area.area_city_short = <string>area.area_city.substring(0, 3).toUpperCase();

        // do we have a new area? then add it
        if (area.area_name != 'undefined')
          if (this.earlierSelectedAreas.filter((areaItem => { return areaItem.area_name == area.area_name })).length == 0) {
            this.earlierSelectedAreas.push(area);
            this.saveSettings();
          }

        // make sure we add a new list of timelines
        this.updateTimeLines();

        // and save all the stuff
        this.saveSettings();
      }
    })
    modal.present({});
  }


  updateTimeLines() {

    // remember how many we have in the view
    let itemCount = this.items.length;

    // reset the view
    this.items = [];

    // add the items
    for (let i = 0; i < itemCount; i++)
      this.addTimeLine();

    // and apply the filter
    this.filterLinesUsingScore();
  }

  copyItemURL(meetingLine: DisplayLine) {

    let queryString = this.platform.url().split('?')[0] + '?';
    let meetingTime: number = 0;

    // build the URL
    meetingLine.areas.map((area, index) => {
      if (area.area_name != 'undefined') {
        queryString += "area" + (index + 1) + "=" + area.area_name + "&";
        meetingTime = area.time_number;
      }
    })

    // finish the URL string
    if (meetingTime != 0) queryString += "now=" + meetingTime;
    if (queryString.slice(-1) == '&') queryString = queryString.slice(0, -1);
    if (queryString.slice(-1) == '?') queryString = queryString.slice(0, -1);

    //console.log('MEETING OPEN ', meetingLine, queryString);

    // open the popover to do the copy/paste action (not working completely)
    this.popoverCtrl.create(TimeslotPage, {
      urlToCopy: queryString,
      meetingLine: meetingLine
    }).present();
  }


  // not used right now
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

  openScoreFilter() {

    let alert = this.alertCtrl.create();
    alert.setTitle('Select score');

    alert.addInput({
      type: 'radio',
      label: '> 75%',
      value: '75',
      checked: true
    });

    alert.addInput({
      type: 'radio',
      label: '> 50%',
      value: '50'
    });

    alert.addInput({
      type: 'radio',
      label: '> 25%',
      value: '25'
    });

    alert.addInput({
      type: 'radio',
      label: 'All',
      value: '0'
    });

    alert.addButton('Cancel');
    alert.addButton({
      text: 'Ok',
      handler: data => {
        //    console.log('Radio data:', data);
        //   this.testRadioOpen = false;
        //  this.testRadioResult = data;
      }
    });

    alert.onDidDismiss(data => {
      //console.log('DATA DREERCEC', data)
      if (data) {
        this.scoreFilter = data;
        this.filterLinesUsingScore();
        this.saveSettings();
      }
    })

    alert.present();
  }


  // not used right now
  //<span (click)="openSettings(scoreFilter)"> <ion-icon name="settings"></ion-icon> </span>
  openSettings(currentnice_code: number) {

    let modal = this.popoverCtrl.create(ConfigPage, {
      scoreFilter: this.scoreFilter,
      earlierSelectedAreas: this.earlierSelectedAreas
    });

    modal.onDidDismiss(data => {
      if (data) {
        this.scoreFilter = data['scoreFilter'];
        this.earlierSelectedAreas = data['earlierSelectedAreas']

        this.saveSettings();

        this.filterLinesUsingScore()
      }
    })

    modal.present();
  }

  doInfinite(infiniteScroll) {
    setTimeout(() => {
      for (let i = 0; i < scrollPageSize; i++)
        this.addTimeLine();

      this.filterLinesUsingScore();

      infiniteScroll.complete();
    }, 1);
  }

  saveSettings() {
    this.storage.set('selectedAreas', this.selectedAreas);
    this.storage.set('earlierSelectedAreas', this.earlierSelectedAreas);
    this.storage.set('scoreFilter', this.scoreFilter)
  }

  loadSettings() {
    this.storage.ready()
      .then(() => {

        this.storage.get('scoreFilter')
          .then((val: number) => {
            if (val) this.scoreFilter = val
            else this.scoreFilter = 0;
          })

        this.storage.get('earlierSelectedAreas')
          .then((val: Array<Area>) => {
            if (val) this.earlierSelectedAreas = val
            else this.earlierSelectedAreas = [];
          })

        this.storage.get('selectedAreas')
          .then((val: Array<AreaDisplay>) => {

            this.selectedAreas = [];

            if (val != null)
              this.selectedAreas = val;

            // check queryparams
            let queryString = ['area1', 'area2', 'area3', 'area4'];
            queryString.map((queryString, index) => {

              let queryArg = this.platform.getQueryParam(queryString);
              if (queryArg)
                if (queryArg != 'undefined') {
                  this.selectedAreas[index].area_name = queryArg;
                  this.selectedAreas[index].area_city = queryArg.split('/').pop();
                  this.selectedAreas[index].area_city_short = this.selectedAreas[index].area_city.substring(0, 3).toUpperCase();
                }
            })

            this.saveSettings();

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

            this.filterLinesUsingScore();
          })
      })
  }
}
