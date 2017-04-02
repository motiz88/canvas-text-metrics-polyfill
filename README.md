canvas-text-metrics-polyfill
============================

[![Greenkeeper badge](https://badges.greenkeeper.io/motiz88/canvas-text-metrics-polyfill.svg)](https://greenkeeper.io/)

A polyfill for the enhanced `context.measureText()` in HTML `<canvas>` v5 / Canvas 2D Context Level 2. Based on https://github.com/Pomax/fontmetrics.js.

The upcoming version of `<canvas>` will offer a standard way to get 2D font metrics, via properties added to the `TextMetrics` object (returned by `context.measureText()`). This feature was drafted in March 2012, but virtually all current browsers (as of November 2014) still follow the older spec and only provide the `TextMetrics.width` property.

This library provides a robust polyfill for the missing metrics on clients with pre-Level 2 `<canvas>`.

API reference
-------------
See:
* https://html.spec.whatwg.org/#drawing-text-to-the-bitmap
* http://www.w3.org/TR/2dcontext2/#drawing-text-to-the-bitmap
* https://lists.whatwg.org/pipermail/whatwg-whatwg.org/2012-March/035239.html 

Demo
----
Try the [visual test page](https://rawgit.com/motiz88/canvas-text-metrics-polyfill/master/tests/visual-test.html).

Tests and performance
---------------------
TBD

Supported browsers
------------------
TBD
