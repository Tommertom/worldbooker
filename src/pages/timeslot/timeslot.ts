import { DisplayLine } from './../home/home';
import { Component } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';



@Component({
  selector: 'page-timeslot',
  templateUrl: 'timeslot.html'
})
export class TimeslotPage {

  meeting: DisplayLine;

  constructor(public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController) {

    /*
     this.entities.sort(function (a, b) {
         let x = a['entityname'].toLowerCase();
         let y = b['entityname'].toLowerCase();
         return x < y ? -1 : x > y ? 1 : 0;
       });
    */

    this.meeting = this.navParams.get('displayLine');
    console.log(' THIS MEETING', this.meeting)

  }

  close() {
    this.viewCtrl.dismiss();
  }
}
