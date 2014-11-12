canvas-text-metrics-polyfill
============================

A polyfill for the enhanced `context.measureText()` in HTML `<canvas>` v5 / Canvas 2D Context Level 2. Based on https://github.com/Pomax/fontmetrics.js.

The upcoming version of `<canvas>` will offer a standard way to get 2D font metrics, via properties added to the `TextMetrics` object (returned by `context.measureText()`). This feature was drafted in March 2012, but virtually all current browsers (as of November 2014) still follow the older spec and only provide the `TextMetrics.width` property.

This library provides a robust polyfill on top of a modest Canvas and DOM implementation.

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
