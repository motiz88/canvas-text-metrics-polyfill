canvas-text-metrics-polyfill
============================

A polyfill for the enhanced context.measureText in HTML Canvas v5 / Canvas 2D Context Level 2. Based on https://github.com/Pomax/fontmetrics.js .

The upcoming version of Canvas will offer a standard way to get 2D font metrics where only a single measurement (width) has been available previously, a feature introduced to the spec in March 2012. However, as of November 2014, browser support for the extra properties is virtually non-existent.

This library provides a robust polyfill based on already-available Canvas and DOM techniques.

API reference
-------------
See:
* https://html.spec.whatwg.org/#drawing-text-to-the-bitmap
* http://www.w3.org/TR/2dcontext2/#drawing-text-to-the-bitmap
* https://lists.whatwg.org/pipermail/whatwg-whatwg.org/2012-March/035239.html 

Demo
----
TBD

Tests and performance
---------------------
TBD

Supported browsers
------------------
TBD
