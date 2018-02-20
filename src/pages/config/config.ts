import { Component } from '@angular/core';
import { NavController, NavParams, ViewController, AlertController } from 'ionic-angular';

/*
    Abandoned code

    <ion-item>
      <button ion-button full (click)="clearHistory()">Clear history of areas</button>
    </ion-item>

    <ion-item *ngFor="let area of displayList" (click)="itemClick(area)">
      {{area.area_name}}
    </ion-item>

*/


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
