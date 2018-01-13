import { Component } from '@angular/core';
import { NavController, NavParams, ViewController, AlertController } from 'ionic-angular';

@Component({
  selector: 'page-config',
  templateUrl: 'config.html'
})
export class ConfigPage {

  earlierSelectedAreas: Array<Object> = [];
  scoreFilter: number;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private alertCtrl: AlertController,
    public viewCtrl: ViewController) {

    this.earlierSelectedAreas = navParams.get('earlierSelectedAreas');
    this.scoreFilter = navParams.get('scoreFilter');
  }

  clearHistory() {
    this.earlierSelectedAreas = [];

    this.alertCtrl.create({
      title: 'History cleared',
      subTitle: 'all earlier areas cleared',
      buttons: ['Ok']
    }).present();
  }

  itemClick(item) {
    this.viewCtrl.dismiss(item);
  }

  close() {
    this.viewCtrl.dismiss({
      earlierSelectedAreas: this.earlierSelectedAreas,
      scoreFilter: Number(this.scoreFilter)
    });
  }
}
