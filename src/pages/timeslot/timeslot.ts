import { DisplayLine } from './../home/home';
import { Component } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';

import * as Clipboard from 'clipboard/dist/clipboard.min.js';

@Component({
  selector: 'page-timeslot',
  templateUrl: 'timeslot.html'
})
export class TimeslotPage {

  meeting: DisplayLine;
  clipboard: any;
  urlToCopy: string = "";

  constructor(public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController) {

    this.urlToCopy = this.navParams.get('urlToCopy');
  }

  ionViewDidEnter() {
    console.log(' THIS MEETING', this.meeting)
    this.clipboard = new Clipboard('#cpyBtn');

    //https://medium.com/coding-snippets/copy-to-clipboard-with-ionic-2-6c31356c008

    this.clipboard.on('success', () => { console.log('YES') });
  }

  close() {
    this.viewCtrl.dismiss();
  }
}
