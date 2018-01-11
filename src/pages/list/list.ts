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
  myInput: string = "";

  constructor(public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController) {

    this.preferredAreas = navParams.get('preferredAreas');
    this.allAreas = navParams.get('allAreas');

    /*
     this.entities.sort(function (a, b) {
         let x = a['entityname'].toLowerCase();
         let y = b['entityname'].toLowerCase();
         return x < y ? -1 : x > y ? 1 : 0;
       });
    */

    this.refreshDisplayList();
    console.log('AL AREAS', this.allAreas);
  }

  onInput(event) {
    console.log('EVENT ', event, this.myInput);
    this.refreshDisplayList();
  }


  onCancel(event) {
    console.log('EVENT ', event, this.myInput);
    this.refreshDisplayList();
  }

  refreshDisplayList() {

    /*
         this.entities = this.getFilteredEntityList().filter(entity => {
          return (entity['offtaker'] + ' ' + entity['entityname'] + ' ' + entity['entitydescription']).toLowerCase().indexOf(this.searchTerm.toLowerCase()) > -1
        })
    
        */
    this.displayList = this.preferredAreas
      .concat(this.allAreas)
      .filter(area => {
        return (area['area_name'] + ' ' + area['city']).toLowerCase().indexOf(this.myInput.toLowerCase()) > -1
      })
  }

  itemTapped(item) {
    this.viewCtrl.dismiss(item);
  }

  close() {
    this.viewCtrl.dismiss();
  }
}
