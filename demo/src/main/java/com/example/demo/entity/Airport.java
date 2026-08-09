package com.example.demo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "airports")
public class Airport {

    @Id
    @Column(name = "airport_code", length = 10)
    private String airportCode;

    @Column(name = "city_name", nullable = false, length = 100)
    private String cityName;

    @Column(name = "airport_name", nullable = false, length = 255)
    private String airportName;

    public Airport() {
    }

    public Airport(String airportCode, String cityName, String airportName) {
        this.airportCode = airportCode;
        this.cityName = cityName;
        this.airportName = airportName;
    }

    public String getAirportCode() {
        return airportCode;
    }

    public void setAirportCode(String airportCode) {
        this.airportCode = airportCode;
    }

    public String getCityName() {
        return cityName;
    }

    public void setCityName(String cityName) {
        this.cityName = cityName;
    }

    public String getAirportName() {
        return airportName;
    }

    public void setAirportName(String airportName) {
        this.airportName = airportName;
    }
}
