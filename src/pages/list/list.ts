import { Component } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';

@Component({
  selector: 'page-list',
  templateUrl: 'list.html'
})
export class ListPage {
  preferredAreas: any;
  allAreas: any;
  displayList: any;

  constructor(public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController) {
    // If we navigated to this page, we will have an item available as a nav param
    this.preferredAreas = navParams.get('preferredAreas');
    this.allAreas = navParams.get('allAreas');

    this.refreshDisplayList();

    console.log('AL AREAS', this.allAreas);
  }

  onInput(event) {
    console.log('EVENT ', event);
  }


  onCancel(event) {
    console.log('EVENT ', event);
  }

  refreshDisplayList() {
    this.displayList = this.preferredAreas.concat(this.allAreas);
  }

  itemTapped(item) {
    this.viewCtrl.dismiss(item);
  }

  close() {
    this.viewCtrl.dismiss();
  }
}
