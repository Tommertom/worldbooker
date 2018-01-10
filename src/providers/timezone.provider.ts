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

@Injectable()
export class TimeZoneProvider {

    zones: Array<Object> = [];
    country: Object = {};
    timezone: Object = {};
    worldcities: Object = {};

    constructor(private http: Http) {

        this.http.get('assets/data/zone.json')
            .map(data => data.json())
            .toPromise()
            .then(data => {
                this.zones = data;
            })

        this.http.get('assets/data/country.json')
            .map(data => data.json())
            .toPromise()
            .then(data => {
                this.country = data;
            })

        this.http.get('assets/data/timezone.json')
            .map(data => data.json())
            .toPromise()
            .then(data => {
                this.timezone = data;
            })

        this.http.get('assets/data/worldcities.json')
            .map(data => data.json())
            .toPromise()
            .then(data => {
                this.worldcities = data;
            })
    };

    getZones() {
        return this.zones;
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
}

