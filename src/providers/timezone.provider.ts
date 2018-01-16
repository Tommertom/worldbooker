import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { Observable } from 'rxjs/Observable';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/mergeAll';
import 'rxjs/add/operator/timeout';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/concat';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/observable/timer';
import 'rxjs/add/observable/interval';

export interface Area {
    area_name: string;
    area_city: string;
}

@Injectable()
export class TimeZoneProvider {

    zones: Array<Object> = [];
    country: Object = {};
    timezone: Object = {};
    worldcities: Object = {};

    constructor(private http: Http) { };

    getZones() {
        return this.http.get('assets/data/zone.json')
            .map(data => data.json())
            .toPromise()
            .then(data => {
                this.zones = data;
                return data
            })
    }

    getCountry() {
        return this.country;
    }

    getTimeZone() {
        return this.timezone;
    }

    getWorldcities() {
        return this.worldcities;
    }

    getTimeStringLong(timezone: string, date: Date) {
        return new Intl.DateTimeFormat('en-GB', {
            hour: 'numeric', minute: 'numeric', // second: 'numeric',
            weekday: 'short', month: 'short', day: 'numeric', //year: 'numeric',
            timeZone: timezone
        }).format(date);
    }


    getTimeStringShort(timezone: string, date: Date) {
        return new Intl.DateTimeFormat('en-GB', {
            hour: 'numeric', minute: 'numeric', // second: 'numeric',
            weekday:'short',
            //month: 'short',// day: 'numeric', //year: 'numeric',            weekday: 'short',
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

        let returnColor = '#2ECC40'; //

        if (timenumber < 630) returnColor = '#FF4136';
        if ((timenumber > 600) && (timenumber < 730)) returnColor = "#FF851B";
        if ((timenumber > 1700) && (timenumber < 1830)) returnColor = "#FF851B";
        if (timenumber > 1830) returnColor = '#FF4136';

        return returnColor;
    }



}

