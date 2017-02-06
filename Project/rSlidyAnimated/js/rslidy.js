// rslidy
// rslidy.js
// Markus Schofnegger, 2015
// Modified 2017 Rok Kogovšek, Alexei Kruglov, Fernando Pulido Ruiz, Helmut Zöhrer
// The main class, including events and style injections.
// Class Rslidy
// Implements the core functionality.
var Rslidy = (function () {
	// Methods
	//
	// Init methods
	//
	// ---
	// Description: Constructor.
	// ---
	function Rslidy() {
		this.os = "";
		this.num_slides = 0;
		this.url_delimiter = "#";
		this.shift_pressed = false;
		this.ctrl_pressed = false;
		this.alt_pressed = false;
		this.meta_pressed = false;
		this.scroll_block_switch = false;
		this.full_overview = false;
		this.full_overview_locked = false;
		this.toc_overview = false;
		this.toc_overview_locked = false;
		this.low_light_mode = false;
		this.timer_enabled = false;
		this.timer_time = 0;
		this.timer_thread = null;
		// Key codes (platform-specific settings in rslidy.platformSpecificSettings() if needed)
		this.key_enter = 13;
		this.key_space = 32;
		this.key_pg_up = 33;
		this.key_pg_down = 34;
		this.key_end = 35;
		this.key_home = 36;
		this.key_left = 37;
		this.key_up = 38;
		this.key_right = 39;
		this.key_down = 40;
		this.key_n = 78;
		this.key_t = 84;
		// Custom settings
		this.presentation_time = 0; // Presentation time in seconds. 0 to disable (hides timer).
		this.close_menu_on_selection = true;
		this.close_navigation_on_selection = true;
		this.start_in_low_light_mode = false;
		this.block_slide_text_selection = false;
		this.svg_fix_on_ios = false;
		this.custom_aspect_ratio = 0; // Use of custom aspect ratio for slides. Possible values are e.g. 4/3 or 16/9. 0 disables it and makes it calculate dynamically.
		this.custom_width = 800; // Used when custom_aspect_ratio is set to a value greater than zero.
		this.overview_slide_zoom = 1.2;
		this.doubletap_delay = 200; // Double tap delay in ms
		this.min_slide_zoom = 0.2; // in em
		this.max_slide_zoom = 3.0; // in em
		this.zoom_step = 0.2; // in em
		this.swipe_max_duration = 400; // maximum duration of swipe in ms
		this.swipe_threshold = 60; // swipe distance
		this.swipe_y_limiter = 1.0; // how many times the x distance should be greater than the y distance (1.0 means x has to be > y, 2.0 means x has to be > 2 * y, 0.0 means disabled)
		this.tilt_sensitivity = 3.0; // Tilt sensitivity, higher sensitivity = less tilt required
		this.shake_sensitivity = 1.0; // Shake sensitivity, higher sensitivity = less shake required
		this.tap_last = 0;
		this.start_x = 0;
		this.start_y = 0;
		this.delta_x = 0;
		this.delta_y = 0;
		this.tilt_value_old = 0;
		this.motion_last = 0;
		this.motion_break = 500; // Minimum interval between movement gestures
		this.button_delay = 150; //delay for all buttons animations
			
		// NEW HELP TEXT - html formated - alert does not have html rendering
		this.help_text = "<head> <title>rSlidy Help</title><link rel='stylesheet' href='css/reset.css'><link rel='stylesheet' href='css/normalise.css'>" +
			"<link rel='stylesheet' href='css/rslidy.css'><link rel='stylesheet' href='css/slides-default.css'></head>" +
			"<body><div class='slide'><h1>rSlidy Help Tab</h1>" +
			"<p>rslidy transforms HTML pages into presentation slides. Its usage is very similar to common presentation software.</p>" +
			"<ul> <li>Use the buttons LEFT and RIGHT to navigate through the slide show. On devices with a touchscreen, it is possible to use swipe gestures.</li>" +
			"<li> All available slides and a table of contents can be shown on the left or right side by hovering at the side - alternatively, you can lock the views with the corresponding buttons in the status bar on the bottom of the page.</li>" +
			"<li> Settings for gestures and the night mode can be changed by clicking the Menu button in the status bar.</li>" +
			"<li> When using mobile device, Shake and Tilt gestures are enabled by default. These can be disabled in the menu. Tilting helps navigating, while shaking resets the presentation to the first slide.</li>" +
			"</ul><p>Other settings like the aspect ratio of the slides and the zoom level of the thumbnails can be changed in the rslidy.js file, while menu options or defualt font size can be also fixed in HTML slide file.</p></div></body>";
	}
	// ---
	// Description: Handles the initialization of rslidy, e.g. setting up the menus.
	// ---
	Rslidy.prototype.init = function () {
		// Set up utils
		this.utils = new Utils();
		// Set up member variables
		this.os = window.navigator.platform;
		this.num_slides = document.querySelectorAll('.slide').length;
		// Call start-up methods
		this.injectSlideNav(); // Splits body in overview and content parts!
		this.injectSpeakerNotesOverlay();
		this.injectStatusBar();
		this.injectMenu();
		this.setCurrentSlide(0, true);
		this.removeAnimation();
		this.setupUserSettings();
		// for click event the addListeners have to be called after setupUserSettings
		this.addListeners();
		this.doStyleAdaptions();
		// Platform specific settings
		this.platformSpecificSettings();
		// Adjust SVG replacements
		this.adjustSVGReplacementsWidth();
		// Initialize the timer
		this.initTimer();
		// Loading finished - loader is hidden
		this.toggleLoading();       
	};
	// ---
	// Description: Adds event listeners like left/right keys.
	// ---
	Rslidy.prototype.setupUserSettings = function () {
		// check if hidden setupDefaultValues div exists
		if(document.getElementById("setupDefaultValues") != null){
			// for each setting toggle effect if it exists and is not the defualt one
			var currentSettingValue = document.getElementById("statusbar-pin-locked");	// is default NO LOCK
			if(currentSettingValue != null && currentSettingValue.value.toLowerCase() == "true"){
				this.pinToggleClicked(false);
			}
			currentSettingValue = document.getElementById("menu-tilt-used");	// TILT is default TRUE
			if(currentSettingValue != null && currentSettingValue.value.toLowerCase() == "false"){
				document.getElementById("checkbox-tilt").checked = false;
			}
			currentSettingValue = document.getElementById("menu-shake-used");	// SHAKE is default TRUE
			if(currentSettingValue != null && currentSettingValue.value.toLowerCase() == "false"){
				document.getElementById("checkbox-shake").checked = false;
			}
			currentSettingValue = document.getElementById("menu-click-nav-used");	// NAV CLICK is default FALSE
			if(currentSettingValue != null && currentSettingValue.value.toLowerCase() == "true"){
				document.getElementById("checkbox-clicknav").checked = true;
			}
			currentSettingValue = document.getElementById("menu-low-light-mode-used");	// LOW LIGHT MODE is default FALSE
			if(currentSettingValue != null && currentSettingValue.value.toLowerCase() == "true"){
				document.getElementById("checkbox-lowlightmode").checked = true;
				this.toggleLowLightMode();
			}
			currentSettingValue = document.getElementById("menu-hide-address-used");	// HIDE ADDRESS is default FALSE
			if(currentSettingValue != null && currentSettingValue.value.toLowerCase() == "true"){
				document.getElementById("checkbox-hideaddressbar").checked = true;
				this.hideAddressBarToggleClicked();
				this.menuToggleClicked(false);
			}
			// font size should be specified in EM
			currentSettingValue = document.getElementById("default-font-size");
			if(currentSettingValue != null){
				this.changeSlideZoom(null, 0);
			} 
		}
	};
	// ---
	// Description: Adds event listeners like left/right keys.
	// ---
	Rslidy.prototype.addListeners = function () {
		// Key listeners
		window.onkeydown = function (e) { this.keyPressed(e, 0); }.bind(this);
		window.onkeyup = function (e) { this.keyPressed(e, 1); }.bind(this);
		// Mouse click listeners for full overview slide thumbnails
		var thumbnail_wrappers = document.getElementsByClassName("slide-clickelement");
		for (var i = 0; i < thumbnail_wrappers.length; i++) {
			thumbnail_wrappers[i].addEventListener('click', function (e) { this.slideSelected(e); }.bind(this));
		}
		// Mouse click listeners for slide links (table of contents)
		var slide_links = document.getElementsByClassName("slide-link");
		for (var i = 0; i < slide_links.length; i++) {
			slide_links[i].addEventListener('click', function (e) { this.slideSelected(e); }.bind(this));
		}
		// Mouse down/up listener for next slide (also prevent navigation by clicking on links)
		document.getElementById("content-section").addEventListener('mousedown', function (e) { this.start_x = e.clientX; this.start_y = e.clientY;
			// clicking somewhere inside the content hides the menu
			var menu = document.getElementById("menu");
			if (menu.classList.contains("hidden") == false)
			{
				menu.style.WebkitTransition = 'opacity 0.3s';
				menu.style.MozTransition = 'opacity 0.3s';
				
				var menu_button = document.getElementById("button-menu");
				this.utils.switchElementsClass([menu_button], "clicked");

				setTimeout(function() { menu_button.value = "Menu"; }, this.button_delay); 

				
				menu.style.opacity = 0;
				
				setTimeout(function() {
					menu.classList.add("hidden");
				}, 300);
				
				
			}
		
		}.bind(this));
		
		document.getElementById("content-section").addEventListener('mouseup', function (e) {
			if (this.start_x == e.clientX && this.start_y == e.clientY
				&& document.getElementById("checkbox-clicknav").checked)
				this.navNext();
		}.bind(this));
		var links = document.getElementsByTagName("a");
		for (var i = 0; i < links.length; i++) {
			links[i].addEventListener('mouseup', function (e) { e.stopPropagation(); }.bind(this));
		}
		// Button listeners
		document.getElementById("overview_trigger").addEventListener('mouseover', function () { this.overviewToggleClicked(false); }.bind(this));
		document.getElementById("toc_trigger").addEventListener('mouseover', function () { this.tocToggleClicked(false); }.bind(this));
		document.getElementById("overview_trigger").addEventListener('mouseout', function () { this.overviewToggleClicked(true); }.bind(this));
		document.getElementById("toc_trigger").addEventListener('mouseout', function () { this.tocToggleClicked(true); }.bind(this));

		document.getElementById("button-overview").addEventListener('click', function () {this.utils.switchElementsClass([document.getElementById("button-overview")], "clicked"); this.full_overview_locked = this.full_overview_locked != true; if(this.full_overview_locked){setTimeout(function() { document.getElementById("button-overview").value = "X"; }, this.button_delay);}else{setTimeout(function() { document.getElementById("button-overview").value = "Slides";}, this.button_delay);} this.overviewToggleClicked(!document.getElementById("button-overview").classList.contains("clicked")); }.bind(this));
		document.getElementById("button-toc").addEventListener('click', function () {this.utils.switchElementsClass([document.getElementById("button-toc")], "clicked");  this.toc_overview_locked = this.toc_overview_locked != true; if(this.toc_overview_locked){setTimeout(function() { document.getElementById("button-toc").value = "X"; }, this.button_delay);}else{setTimeout(function() { document.getElementById("button-toc").value = "ToC"; }, this.button_delay);} this.tocToggleClicked(!document.getElementById("button-toc").classList.contains("clicked")); }.bind(this));
		document.getElementById("status-bar-nav-button-previous").addEventListener('click', function () { this.navPrevious(); }.bind(this));
		document.getElementById("status-bar-nav-button-next").addEventListener('click', function () { this.navNext(); }.bind(this));
		document.getElementById("status-bar-nav-button-first")
			.addEventListener('click', function ()
			{
				this.showSlide(0);
			}.bind(this));
		document.getElementById("status-bar-nav-button-last")
			.addEventListener('click', function ()
			{
				this.showSlide(this.num_slides - 1);
			}.bind(this));
		document.getElementById("timer").addEventListener('click', function () { this.toggleTimer(); }.bind(this));
		document.getElementById("slide-caption").addEventListener('click', function () { this.tocToggleClicked(false); }.bind(this));
		
		document.getElementById("status-bar-pin-button").addEventListener('click', function () { this.pinToggleClicked(false); }.bind(this));
		
		document.getElementById("button-menu").addEventListener('click', function () { this.menuToggleClicked(false); }.bind(this));
		document.getElementById("button-help").addEventListener('click', function () { if (this.close_menu_on_selection == true)
			this.menuToggleClicked(false); var newWindow = window.open(); newWindow.document.write(this.help_text); }.bind(this));
		document.getElementById("button-zoom-more").addEventListener('click', function (e) { this.changeSlideZoom(e, 1); }.bind(this));
		document.getElementById("button-zoom-reset").addEventListener('click', function (e) { this.changeSlideZoom(e, 0); }.bind(this));
		document.getElementById("button-zoom-less").addEventListener('click', function (e) { this.changeSlideZoom(e, -1); }.bind(this));
		// Checkbox listeners
		document.getElementById("checkbox-tilt").addEventListener('click', function () { if (this.close_menu_on_selection == true)
			this.menuToggleClicked(false); }.bind(this));
		document.getElementById("checkbox-shake").addEventListener('click', function () { if (this.close_menu_on_selection == true)
			this.menuToggleClicked(false); }.bind(this));
		document.getElementById("checkbox-clicknav").addEventListener('click', function () { if (this.close_menu_on_selection == true)
			this.menuToggleClicked(false); }.bind(this));
		document.getElementById("checkbox-lowlightmode").addEventListener('click', function () { this.lowLightModeToggleClicked(); }.bind(this));
		document.getElementById("checkbox-hideaddressbar").addEventListener('click', function () { this.hideAddressBarToggleClicked(); }.bind(this));
		// Input listeners
		document.getElementById("slide-input").addEventListener('keyup', function (e) { this.slideInputKeyPressed(e); }.bind(this));
		// Window listeners
		window.addEventListener('hashchange', function () { this.onHashchange(); }.bind(this));
		// Custom touch listeners, since hammer.js gives problems
		var content_section = document.getElementById("content-section");
		content_section.addEventListener('touchstart', function (e) { this.onTouchstart(e); }.bind(this));
		content_section.addEventListener('touchmove', function (e) { this.onTouchmove(e); }.bind(this));
		content_section.addEventListener('touchend', function (e) { this.onTouchend(e); }.bind(this));
		// Allow simple touch events on speaker notes overlay (for double tap to hide)
		var speaker_notes_overlay = document.getElementById("speakernotes-overlay");
		speaker_notes_overlay.addEventListener('touchstart', function (e) { this.onTouchstart(e); }.bind(this));
		//content_section.addEventListener('touchmove', function (e) { e.stopPropagation(); }.bind(this));
		//document.addEventListener("touchmove", function (e) { e.preventDefault(); }.bind(this)); // Disables all scrolling!
		// Window listeners
		window.onresize = function (e) { this.adjustOverviewPanel(); this.adjustSVGReplacementsWidth(); }.bind(this);
		// Device listeners used for TILT and SHAKE
		if (window.DeviceOrientationEvent) {
			window.addEventListener('deviceorientation', function (e) { this.onDeviceOrientation(e); }.bind(this));
		}
		if (window.DeviceMotionEvent) {
			window.addEventListener('devicemotion', function (e) { this.onDeviceMotion(e); }.bind(this));
		}
		// Set motion break if device changes from PORTRAIT to LANDSCAPE or vice versa (prevent unintended slide navigation)
		window.addEventListener("orientationchange", function (e) { this.motion_last = (new Date).getTime(); }.bind(this));
		
		  // Input listeners
		var images = document.getElementsByTagName("img");
	//	var content_section = document.getElementById("content-section");
		var images  = content_section.getElementsByTagName("img");

		for (var i=0, len=images.length, img; i<len; i++) {
		  img = images[i];
		  img.addEventListener("click", function() {
			openImageTab(this.src);
		  });
		}
	};
	// ---
	// Description: Used for final style adaptions.
	// ---
	Rslidy.prototype.doStyleAdaptions = function () {
		// Start in night mode if set
		if (this.start_in_low_light_mode == true) {
			this.toggleLowLightMode();
			document.getElementById("checkbox-lowlightmode").checked = true;
		}
		// Block slide text selection if set
		if (this.block_slide_text_selection == true) {
			var content_section = document.getElementById("content-section");
			var original_slides = content_section.getElementsByClassName("slide");
			for (var i = 0; i < original_slides.length; i++)
				original_slides[i].classList.add("noselect");
		}
	};
	// ---
	// Description: Initializes the timer.
	// ---
	Rslidy.prototype.initTimer = function () {
		// Initialize the timer or hide it if this.presentation_time <= 0
		var timer = document.getElementById("timer");
		// Hide timer or set time
		if (this.presentation_time <= 0)
			timer.classList.add("hidden");
		else {
			var minutes = Math.floor(this.presentation_time / 60);
			var seconds = this.presentation_time % 60;
			timer.innerHTML = this.utils.toTwoDigits(minutes) + ":" + this.utils.toTwoDigits(seconds);
			this.timer_time = this.presentation_time;
		}
	};
	// ---
	// Description: Toggles the animated loader
	// ---
	Rslidy.prototype.toggleLoading = function () {
		this.utils.switchElementsClass([document.getElementById('loader')],"hidden");
	}
	// ---
	// Description: Toggles the timer. Works only if this.presentation_time > 0.
	// ---
	Rslidy.prototype.toggleTimer = function () {
		// Return if this.presentation_time <= 0
		if (this.presentation_time <= 0)
			return;
		// Reset and return if this.timer_time <= 0
		if (this.timer_time <= 0) {
			this.initTimer();
			return;
		}
		if (this.timer_enabled == false) {
			// Run
			this.timer_thread = setInterval(function () {
				// Break out if this.presentation_time is <= 0
				if (this.timer_time <= 0) {
					clearInterval(this.timer_thread);
					this.timer_enabled = false;
					return;
				}
				this.timer_time -= 1;
				var timer = document.getElementById("timer");
				var minutes = Math.floor(this.timer_time / 60);
				var seconds = this.timer_time % 60;
				timer.innerHTML = this.utils.toTwoDigits(minutes) + ":" + this.utils.toTwoDigits(seconds);
			}.bind(this), 1000);
			this.timer_enabled = true;
		}
		else {
			// Stop
			clearInterval(this.timer_thread);
			this.timer_enabled = false;
		}
	};
	// ---
	// Description: Performs platform-specific settings.
	// ---
	Rslidy.prototype.platformSpecificSettings = function () {
		// Settings
		this.utils.debug("Searching settings for platform: " + this.os);
		switch (this.os) {
			case ("Win16"):
				// ...
				break;
			case ("Win32"):
				// ...
				break;
			case ("MacIntel"):
				// ...
				break;
			case ("iPhone"):
				if (this.svg_fix_on_ios == true)
					this.changeSVGTags();
				break;
			case ("iPad"):
				if (this.svg_fix_on_ios == true)
					this.changeSVGTags();
				break;
			case ("iPod"):
				if (this.svg_fix_on_ios == true)
					this.changeSVGTags();
				break;
			default:
				this.utils.debug("Unknown platform!");
		}
	};
	// ---
	// Description: Changes the SVG img-tags to make them work on iOS.
	// ---
	Rslidy.prototype.changeSVGTags = function () {
		// Variables
		var items = document.querySelectorAll('.svg');
		// Change the tags
		for (var i = 0; i < items.length; i++) {
			// Add new class to outer link
			var outer_link = items[i].parentElement;
			if (outer_link != null)
				outer_link.classList.add("svg-link");
			var item_new = '<object class="svg svg-replacement" data="' + items[i].getAttribute("src") + '" type="image/svg+xml"></object>';
			items[i].outerHTML = item_new;
		}
	};
	//
	// Style methods
	//
	// ---
	// Description: Adds the slide navigation to the original document (splits original body).
	// ---
	Rslidy.prototype.injectSlideNav = function () {
		// Wrap content-section element around body and add slive nav button
		var body_old = document.body.innerHTML;
		var body_new = '<div id="content-section">' +
			body_old +
			'</div>';
		// Add slide nav and entries
		var overview_content = this.buildOverviewContent();
		body_new = body_new + overview_content;
		// Set new body (and wrap div around overview and content section)
		document.body.innerHTML = '<div id="new-body">' + body_new + '</div>';
		// Reset styles for slide navigation (e.g. transform)11
		this.adjustOverviewPanel();
	};
	// ---
	// Description: Builds the content for the overmenu menu (thumbnail images etc.).
	// ---
	Rslidy.prototype.buildOverviewContent = function () {
		var overview_content = '<div id="overview_trigger"><div id="overview">';
		var toc_content = '<div id="toc_trigger"><div id="toc">';
		var original_slides = document.getElementsByClassName("slide");
		for (var i = 0; i < this.num_slides; i++) {
			//slide_nav += '<canvas class="slide-canvas" width="' + browser_width + '" height="' + browser_height + '"></canvas>';
			var slide = original_slides[i].outerHTML;
			// > -------------------
			// *** FULL OVERVIEW ***
			// < -------------------
			// Open wrapper and clickable element (this is necessary because of bug in firefox)
			overview_content += '<div class="slide-thumbnail" data-slideindex="' + i + '">';
			overview_content += '<div class="slide-clickelement" data-slideindex="' + i + '">';
			// Add thumbnail content
			overview_content += '<div class="overview-item noselect" data-slideindex="' + i + '">' + slide + '</div>';
			// Close wrapper and clickable element
			overview_content += '</div>';
			overview_content += '</div>';
			// Add thumbnail caption
			overview_content += '<div class="thumbnail-caption noselect">' + (i + 1) + ' / ' + this.num_slides + '</div>';
			// > -------------------
			// *** TABLE OF CONTENTS ***
			// < -------------------
			// Add only slide-link and make it a link showing the first words of the title (hidden on beginning!)
			toc_content += '<div class="slide-link" data-slideindex="' + i + '">';
			// Add short title
			toc_content += (this.utils.toInt(i) + 1) + '. ' + this.getSlideHeading(original_slides[i]);
			// Close slide-link
			toc_content += '</div>';
		}
		//slide_nav += '</div>';
		overview_content += '</div></div>';
		toc_content += '</div></div>';
		return overview_content + toc_content;
	};
	// ---
	// Description: Adjusts the aspect ratio and display sizes of the thumbnail images in the overview menu.
	// ---
	Rslidy.prototype.adjustOverviewPanel = function () {
		// Get items
		var thumbnail_wrappers = document.getElementsByClassName("slide-thumbnail");
		var overview_items = document.getElementsByClassName("overview-item");
		// Get the percentage of width pixels of the overview section with respect to window.outerWidth
		var aspect_ratio = (this.custom_aspect_ratio != 0) ? this.custom_aspect_ratio : this.utils.getCurrentAspectRatio();
		var overview_slide_zoom = this.overview_slide_zoom;
		var custom_width = this.custom_width;
		var final_width = custom_width / overview_slide_zoom;
		var overview_element = document.getElementById("overview");
		var relative_width = this.utils.getRelativeWidth(overview_element, aspect_ratio, final_width);
		for (var i = 0; i < this.num_slides; i++) {
			// 1. Set width and height of the overview element to outerWidth and outerHeight, respectively
			overview_items[i].style.width = this.utils.getSlideWidth(aspect_ratio, final_width) + "px";
			overview_items[i].style.height = this.utils.getSlideHeight(aspect_ratio, final_width) + "px";
			// 2. Do the transformation of the overview element now with relative_width (browser compatibility)
			var scale_value = "scale3d(" + relative_width + ", " + relative_width + ", " + relative_width + ")";
			var origin_value = "0px 0px 0px";
			overview_items[i].style.transform = scale_value; // safety first
			overview_items[i].style.transformOrigin = origin_value; // safety first
			overview_items[i].style.MozTransform = scale_value;
			overview_items[i].style.MozTransformOrigin = origin_value;
			overview_items[i].style.webkitTransform = scale_value;
			overview_items[i].style.webkitTransformOrigin = origin_value;
			overview_items[i].style.msTransform = scale_value;
			overview_items[i].style.msTransformOrigin = origin_value;
			// 3. Now, set the width pixels of the wrapper element to the overview width pixels and calculate its height with the aspect ratio
			thumbnail_wrappers[i].style.width = overview_element.clientWidth + "px";
			thumbnail_wrappers[i].style.height = overview_element.clientWidth / (this.utils.getSlideWidth(aspect_ratio, final_width) / this.utils.getSlideHeight(aspect_ratio, final_width)) + "px";
		}
	};
	// ---
	// Description: Adjusts the width of replaced SVG images.
	// ---
	Rslidy.prototype.adjustSVGReplacementsWidth = function () {
		// Get items
		var svg_replacements = document.getElementsByClassName("svg-replacement");
		var browser_width = window.innerWidth;
		for (var i = 0; i < svg_replacements.length; i++) {
			// Reset width
			svg_replacements[i].style.width = "auto";
			// Try to set max height
			svg_replacements[i].style.height = "20em";
			if (svg_replacements[i].clientWidth + svg_replacements[i].getBoundingClientRect().left > browser_width) {
				// Unset max height and set width instead if browser window is too small
				svg_replacements[i].style.height = "auto";
				svg_replacements[i].style.width = (browser_width - svg_replacements[i].getBoundingClientRect().left) + "px";
			}
		}
	};
	// ---
	// Description: Adds the speaker notes overlay to the document.
	// ---
	Rslidy.prototype.injectSpeakerNotesOverlay = function () {
		// Get old body
		var body_old = document.body.innerHTML;
		// Open status bar and content wrapper
		var speaker_notes_overlay = '<div id="speakernotes-overlay">';
		speaker_notes_overlay += '</div>';
		// Set new body
		document.body.innerHTML = speaker_notes_overlay + body_old;
	};
	// ---
	// Description: Adds the status bar to the document.
	// ---
	Rslidy.prototype.injectStatusBar = function () {
		// Get old body
		var body_old = document.body.innerHTML;
		// Open status bar and content wrapper
		var status_bar = '<div id="status-bar">';
		status_bar += '<div id="status-bar-content">';
		status_bar += '<div id="progress-bar-indicator-left"></div>';
		status_bar += '<div id="progress-bar-indicator-right"></div>';
		status_bar += '<div id="progress-bar"></div>';
		status_bar += '<input type="button" value="Slides" title="Pin slides preview on the left side" id="button-overview" class="status-bar-item" style="width: 4em">';
		// Add overview button
		// Add TOC button
		status_bar += '<input type="button" value="ToC" title="Pin table of content on the right side" id="button-toc" class="status-bar-item" style="width: 3.5em">';
		// Add buttons for previous/next slide
		
		var image_previous = "<img class='ignore' src='data:image/svg+xml;utf8,<svg width=\"12\" height=\"16\" viewBox=\"3 0 16 12\" xmlns=\"http://www.w3.org/2000/svg\"><polygon points=\"16,0 16,16 4,8\" style=\"fill:black;\" /></svg>'>";
		var image_next = "<img class='ignore' src='data:image/svg+xml;utf8,<svg width=\"12\" height=\"16\" viewBox=\"-3 0 16 12\" xmlns=\"http://www.w3.org/2000/svg\"><polygon points=\"0,0 0,16 12,8\" style=\"fill:black;\" /></svg>'>";
		var image_first = "<img class='ignore' src='data:image/svg+xml;utf8,<svg width=\"12\" height=\"16\" viewBox=\"1 0 16 12\" xmlns=\"http://www.w3.org/2000/svg\"><polygon points=\"1,0 4,0 4,16 1,16\" style=\"fill:black;\" /> /><polygon points=\"16,0 16,16 4,8\" style=\"fill:black;\" /> /> </svg>'>";
		var image_last = "<img class='ignore' src='data:image/svg+xml;utf8,<svg width=\"12\" height=\"16\" viewBox=\"-1 0 16 12\" xmlns=\"http://www.w3.org/2000/svg\"><polygon points=\"0,0 0,16 12,8\" style=\"fill:black;\" /><polygon points=\"15,0 12,0 12,16 15,16\" style=\"fill:black;\" /></svg>'>";
		
		var image_pin = "<img class='ignore' src='data:image/svg+xml;utf8,<svg width=\"12\" height=\"16\" viewBox=\"-1 0 16 12\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"11\" cy=\"3\" r=\"3\" stroke=\"black\" stroke-width=\"0.5\" fill=\"rgba(0,0,0,0.9)\" /><polygon points=\"11,5 10,4 0,16\" style=\"fill:black;\" /></svg>'>";
		
		// Add left nevigation buttons
		status_bar += '<div class="hidden-on-mobile" id="status-bar-button-nav-left">';
		status_bar += '<button id="status-bar-nav-button-first" class="status-bar-nav-button" title="Go to the first slide" type="button">' + image_first + '</button>';
		status_bar += '<button id="status-bar-nav-button-previous" class="status-bar-nav-button" title="Go to the previous slide" type="button">' + image_previous + '</button>';
		status_bar += '</div>';
		// Add current slide number
		status_bar += '<div id="status-bar-button-nav-info">';
		status_bar += '<div title="Jump to slide ..." id="slide-input-container"><input value="1" id="slide-input" type="textbox" maxlength="3"></div>';
		status_bar += '<div title="Slide count" id="slide-caption"> /?</div>';
		status_bar += '</div>';
		// Add right nevigation buttons
		status_bar += '<div class="hidden-on-mobile" id="status-bar-button-nav-right">';
		status_bar += '<button id="status-bar-nav-button-next" class="status-bar-nav-button" title="Go to the next slide" type="button">' + image_next + '</button>';
		status_bar += '<button id="status-bar-nav-button-last" class="status-bar-nav-button" title="Go to the last slide" type="button">' + image_last + '</button>';
		status_bar += '</div>';
		
		// Add menu button
		status_bar += '<input value="Menu" id="button-menu" class="status-bar-item" title="Open the menu" type="button">';
		status_bar += '<button id="status-bar-pin-button" class="status-bar-item hidden-on-mobile" title="Pin the status bar" type="button">' + image_pin + '</button>';
		 // Add timer
		status_bar += '<div class="status-bar-item" id="timer">00:00</div>';
		// Close content wrapper and status bar
		status_bar += '</div>';
		status_bar += '</div>';
		// Set new body
		document.body.innerHTML = status_bar + body_old;
	};
	
	// ---
	// Description: Adds the menu to the document.
	// ---
	Rslidy.prototype.injectMenu = function () {
		// Get old body
		var body_old = document.body.innerHTML;
		// Open menu (hidden at beginning)
		var menu = '<div id="menu" class="hidden">';
		// Add menu content
		var texttt = this.help_text;
		menu += '<div class="menu-content" style="text-align:center"><button id="button-help" style="width:100%" title="Get some help">Help</button></div>';
		menu += '<hr>'
		menu += '<div class="menu-content" style="text-align:center"><button id="button-zoom-more" style="width:30%" title="Increase font size">A+</button> <button id="button-zoom-reset" style="width:20%" title="Reset font size">R</button> <button id="button-zoom-less" style="width:30%" title="Decrease font size">A-</button></div>';
		menu += '<hr>'
		menu += '<div class="menu-content"><label>Tilt <input type="checkbox" value="Tilt" id="checkbox-tilt" checked disabled></label></div>';
		menu += '<div class="menu-content"><label>Shake <input type="checkbox" value="Shake" id="checkbox-shake" checked disabled></label></div>';
		menu += '<div class="menu-content"><label>Click Nav <input type="checkbox" value="Tilt" id="checkbox-clicknav"></label></div>';
		menu += '<div class="menu-content"><label>Low Light Mode <input type="checkbox" value="Low Light Mode" id="checkbox-lowlightmode"></label></div>';
		menu += '<div class="menu-content"><label>Hide Address Bar <input type="checkbox" value="Hide Address Bar" id="checkbox-hideaddressbar"></label></div>';
		// Close menu
		menu += '</div>';
		// Set new body
		document.body.innerHTML = menu + body_old;
	};
	//
	// Key/Mouse event methods and listeners
	//
	// ---
	// Description: Called whenever a key is pressed.
	// e: Event.
	// mode: Specifies the mode (0 for down, 1 for up).
	// ---
	Rslidy.prototype.keyPressed = function (e, mode) {
		var key = e.keyCode ? e.keyCode : e.which;
		// Modifier keys (CTRL, SHIFT, ALT, META (WIN on Windows, CMD on Mac))
		this.ctrl_pressed = e.ctrlKey;
		this.shift_pressed = e.shiftKey;
		this.alt_pressed = e.altKey;
		this.meta_pressed = e.metaKey;
		
		var content_section = document.getElementById("content-section");
		
		var step = 1;
		var i = 0;
		
		// Normal key codes
		switch (key) {
			case (this.key_space):
				if (mode == 0)
					this.navNext();
				break;
			case (this.key_enter):
				if (document.getElementById("slide-input") === document.activeElement)
					break;
				if (mode == 0)
					this.navNext();
				break;
			case (this.key_pg_up):
				if (mode == 0)
					this.navPrevious();
				break;
			case (this.key_pg_down):
				if (mode == 0)
					this.navNext();
				break;
			case (this.key_end):
				if (mode == 0)
					this.showSlide(this.num_slides - 1);
				break;
			case (this.key_home):
				if (mode == 0)
					this.showSlide(0);
				break;
			case (this.key_left):
				if (mode == 0)
					this.navPrevious();
				break;
			case (this.key_up):
				if (mode == 0)
					// busy wait to ease scrolling
					for (var i = 1; i <= 10; i++) {
						(function(index) {
							setTimeout(function() { content_section.scrollTop -= index*step; }, i * 20);
						})(i);
					}
					e.preventDefault();
				break;
			case (this.key_right):
				if (mode == 0)
					this.navNext();
				break;
			case (this.key_down):
				if (mode == 0)
					// busy wait to ease scrolling
					for (var i = 1; i <= 10; i++) {
						(function(index) {
							setTimeout(function() { content_section.scrollTop += index*step; }, i * 20);
						})(i);
					}					
					e.preventDefault();
				break;
			case (this.key_n):
				if (mode == 0)
					this.toggleSpeakerNotes(null, false);
				break;
			case (this.key_t):
				if (mode == 0)
					this.toggleTimer();
				break;
			default:
				this.utils.debug("Unknown key event (mode = " + mode + "): " + key);
		}
	};
	// ---
	// Description: Called whenever a slide thumbnail in the overview gets clicked.
	// e: Event.
	// ---
	Rslidy.prototype.slideSelected = function (e) {
		// Get the click target
		var target = e.target;
		// Fix for z-index bug on iOS
		while (target.className != "slide-clickelement" && target.className != "slide-link")
			target = target.parentElement;
		// Get the index of the slide
		var slide_index = target.dataset.slideindex;
		// Switch to this slide
		this.showSlide(slide_index);
		// Close overview menu if desired
		if (this.close_navigation_on_selection == true) {
			var content_section = document.getElementById("content-section");
			var buttonOV = document.getElementById("button-overview");
			var buttonTOC = document.getElementById("button-toc");
			content_section.classList.remove("shifted-overview");
			content_section.classList.remove("shifted-toc");
			if(buttonOV.classList.contains("clicked")){
				this.utils.switchElementsClass([buttonOV], "clicked");
				buttonOV.value = "Slides";
			this.full_overview_locked = false;
			}
			if(buttonTOC.classList.contains("clicked")){
				this.utils.switchElementsClass([buttonTOC], "clicked");
				buttonTOC.value = "ToC";
			this.toc_overview_locked = false;
		}
			this.full_overview = false;
			this.toc_overview = false;
		}
		// Prevent link clicking (iOS)
		e.preventDefault();
	};
	// ---
	// Description: Called whenever the overview button is clicked.
	// close_only: Specifies whether the overview should only be closed.
	// ---
	Rslidy.prototype.overviewToggleClicked = function (close_only) {
		//console.log("OV: " + this.full_overview + " LOCKED: " + this.full_overview_locked + " CLOSE: " + close_only);
		close_only = close_only || false;

		var content_section = document.getElementById("content-section");
		if((this.full_overview_locked && !this.full_overview && !close_only && !content_section.classList.contains("shifted-overview")) ||
			(!this.full_overview_locked && this.full_overview == close_only)){
			this.utils.switchElementsClass([content_section], "shifted-overview"); // Fix for Chrome on iOS
			this.full_overview = this.full_overview != true;
		}
	};
	// ---
	// Description: Called whenever the toc button is clicked.
	// close_only: Specifies whether the overview should only be closed.
	// ---
	Rslidy.prototype.tocToggleClicked = function (close_only) {
		//console.log("TOC: " + this.toc_overview + " LOCKED: " + this.toc_overview_locked + " CLOSE: " + close_only);
		close_only = close_only || false;

		var content_section = document.getElementById("content-section");
		if((this.toc_overview_locked && !this.toc_overview && !close_only && !content_section.classList.contains("shifted-toc")) ||
			(!this.toc_overview_locked && this.toc_overview == close_only)){
			this.utils.switchElementsClass([content_section], "shifted-toc"); // Fix for Chrome on iOS
			this.toc_overview = this.toc_overview != true;
	}
	};
	// ---
	// Description: Called whenever the menu button is clicked.
	// close_only: Specifies whether the menu should only be closed.
	// ---
	Rslidy.prototype.menuToggleClicked = function (close_only) {
		close_only = close_only || false;
		// Toggle menu show status
		
		
		// NEW: fade in/out effects
		
		var menu = document.getElementById("menu");
		var menu_button = document.getElementById("button-menu");

		if (menu.classList.contains("hidden") == true)
		{			
			menu.classList.remove("hidden");
			menu.classList.add("not_hidden");

			this.utils.switchElementsClass([menu_button], "clicked");

			setTimeout(function() { menu_button.value = "X"; }, this.button_delay); 
			
			setTimeout(function() {
				menu.style.WebkitTransition = 'opacity 0.3s';
				menu.style.MozTransition = 'opacity 0.3s';
			
				menu.style.opacity = 1;
			}, 5);
		}
		else
		{			
			menu.style.WebkitTransition = 'opacity 0.3s';
			menu.style.MozTransition = 'opacity 0.3s';
			
			menu.style.opacity = 0;
			
			this.utils.switchElementsClass([menu_button], "clicked");

			setTimeout(function() { menu_button.value = "Menu"; }, this.button_delay); 

			setTimeout(function() {
				menu.classList.remove("not_hidden");
				menu.classList.add("hidden");
			}, 300);
		}
	};
	
	
	
	Rslidy.prototype.pinToggleClicked = function (close_only) {
		close_only = close_only || false;
		// Toggle menu show status
		
		
		// NEW: fade in/out effects
		
		var pin_button = document.getElementById("status-bar-pin-button");
		var status_bar = document.getElementById("status-bar-content");
		var indicator_left = document.getElementById("progress-bar-indicator-left");
		var indicator_right = document.getElementById("progress-bar-indicator-right");

		if (pin_button.title == "Pin the status bar")
		{
			pin_button.title = "Unpin the status bar";
			status_bar.style = "transform: translateY(0);";
			pin_button.style.WebkitTransition = 'opacity 0.3s';
			pin_button.style.MozTransition = 'opacity 0.3s';
			
			pin_button.style.opacity = 0.5;
			indicator_left.style.visibility = "hidden";
			indicator_right.style.visibility = "hidden";
		}
		else
		{			
			pin_button.title = "Pin the status bar";
			status_bar.removeAttribute('style');
			
			pin_button.style.opacity = 1;
			
			indicator_left.style.visibility = "visible";
			indicator_right.style.visibility = "visible";
		}
	};
	
	
	// ---
	// Description: Called whenever one of the text size buttons is clicked.
	// e: The event.
	// value: Specifies the zoom modifier (1 = more, -1 = less).
	// ---
	Rslidy.prototype.changeSlideZoom = function (e, value) {
		var slides_large = document.querySelectorAll('#content-section .slide');
		var defualtUserFontSize = document.getElementById("default-font-size");
		if(defualtUserFontSize != null && defualtUserFontSize.value != ""){
			defualtUserFontSize = defualtUserFontSize.value;
		}else{
			defualtUserFontSize = "1.0em"; // rSLidy default
		}
		for (var i = 0; i < slides_large.length; i++) {
			if (value == 0){
				slides_large[i].style.fontSize = defualtUserFontSize;
			}
			var current_font_size = parseFloat(slides_large[i].style.fontSize);
			if ((current_font_size > this.min_slide_zoom && value == -1) || (current_font_size < this.max_slide_zoom && value == 1))
				slides_large[i].style.fontSize = current_font_size + (this.zoom_step * value) + "em";
			else if (isNaN(current_font_size))
				slides_large[i].style.fontSize = (1.0 + (this.zoom_step * value)) + "em";
		}
		// Adjust SVG replacements
		this.adjustSVGReplacementsWidth();
		// Prevent default actions after event handling
		if(e != null)
			e.preventDefault();
	};
	// ---
	// Description: Called whenever the night mode button is clicked.
	// ---
	Rslidy.prototype.lowLightModeToggleClicked = function () {
		// Invert everything
		this.toggleLowLightMode();
		// Close menu if this.close_menu_on_selection == true
		if (this.close_menu_on_selection == true)
			this.menuToggleClicked(false);
	};
	
	
	
	Rslidy.prototype.hideAddressBarToggleClicked = function () {
		
		
	if(document.getElementById("checkbox-hideaddressbar").checked == true)
	{
		
		var jq = document.createElement("script");

	jq.addEventListener("load", proceed); // pass my hoisted function
	jq.src = "http://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.3/jquery.min.js";
	document.querySelector("head").appendChild(jq);
	
		function proceed () {
		$('a[href]').each(function () {
							var href = this.href;
			
							$(this).removeAttr('href').css('cursor', 'pointer').click(function () { // gets rid of the href (no addres on mouseover) but has pointer as cursor
								if (href.toLowerCase().indexOf("#") >= 0) {
			
								} else {
									var redirectWindow = window.open(href, '_blank');
									redirectWindow.location; // opens in new tab
								}
							});
						});

		}
	}
	else if(document.getElementById("checkbox-hideaddressbar").checked == false)
	{
		var jq = document.createElement("script");

	jq.addEventListener("load", proceed); // pass my hoisted function
	jq.src = "http://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.3/jquery.min.js";
	document.querySelector("head").appendChild(jq);
	
		function proceed () {
		$('a').each(function () {
			$(this).removeAttr("style");
			var href = $(this).text();
							$(this).attr("href", href).click(function () { // gets rid of the href (no addres on mouseover) but has pointer as cursor
							
								
								if (href.toLowerCase().indexOf("#") >= 0) {
			
								} else {
									var redirectWindow = window.open(href, '_blank');
									redirectWindow.location; // opens in new tab
								}
								
							});
						});

		}
	}

		
		
		
		// Close menu if this.close_menu_on_selection == true
		if (this.close_menu_on_selection == true)
			this.menuToggleClicked(false);
	};
	
	
	
	// ---
	// Description: Called whenever a key in the slide input text box was pressed.
	// e: The event.
	// ---
	Rslidy.prototype.slideInputKeyPressed = function (e) {
		var key = e.keyCode ? e.keyCode : e.which;
		var slide_input = document.getElementById("slide-input");
		var value = slide_input.value;
		if (key == this.key_enter) {
			var is_number = /^[0-9]+$/.test(value);
			if (is_number == true)
				this.showSlide(this.utils.toInt(value) - 1);
			else
				slide_input.value = (this.getCurrentSlideIndex() + 1);
			// Take away focus
			slide_input.blur();
		}
	};
	// ---
	// Description: Called whenever the night mode button is clicked.
	// ---
	Rslidy.prototype.toggleLowLightMode = function () {
		// Vars
		var class_color_invert = "color-invert";
		var class_low_light_mode = "night-mode";
		// Invert everything
		var htmls = document.getElementsByTagName("html");
		this.utils.switchElementsClass(htmls, class_color_invert);

		
		
		// NEW: invert status bar as well
		if(document.body.style.backgroundColor == "")
		{
			document.body.style.backgroundColor = "#000000";
		}
		else
		{
			document.body.style.backgroundColor = "";
		}
		
			
		// Apply invert again to elements which should stay the same (e.g. images)
		var imgs = document.getElementsByTagName("img");
		this.utils.switchElementsClass(imgs, class_color_invert);
		//var figures: any = document.getElementsByTagName("figure");
		//this.utils.switchElementsClass(figures, class_color_invert);
		//var figcaptions: any = document.getElementsByTagName("figcaption");
		//this.utils.switchElementsClass(figcaptions, class_color_invert);
		var svg_replacements = document.getElementsByClassName("svg-replacement");
		this.utils.switchElementsClass(svg_replacements, class_color_invert);
		// Add custom classes to h1, h2, h3, p, span, li, ul, ol, pre and a
		var h1s = document.getElementsByTagName("h1");
		this.utils.switchElementsClass(h1s, class_low_light_mode);
		this.utils.invertElementsColor(h1s, this.low_light_mode);
		var h2s = document.getElementsByTagName("h2");
		this.utils.switchElementsClass(h2s, class_low_light_mode);
		this.utils.invertElementsColor(h2s, this.low_light_mode);
		var h3s = document.getElementsByTagName("h3");
		this.utils.switchElementsClass(h3s, class_low_light_mode);
		this.utils.invertElementsColor(h3s, this.low_light_mode);
		var ps = document.getElementsByTagName("p");
		this.utils.switchElementsClass(ps, class_low_light_mode);
		this.utils.invertElementsColor(ps, this.low_light_mode);
		var lis = document.getElementsByTagName("li");
		this.utils.switchElementsClass(lis, class_low_light_mode);
		this.utils.invertElementsColor(lis, this.low_light_mode);
		var uls = document.getElementsByTagName("ul");
		this.utils.switchElementsClass(uls, class_low_light_mode);
		this.utils.invertElementsColor(uls, this.low_light_mode);
		var ols = document.getElementsByTagName("ol");
		this.utils.switchElementsClass(ols, class_low_light_mode);
		this.utils.invertElementsColor(ols, this.low_light_mode);
		var pres = document.getElementsByTagName("pre");
		this.utils.switchElementsClass(pres, class_low_light_mode);
		this.utils.invertElementsColor(pres, this.low_light_mode);
		var as = document.getElementsByTagName("a");
		this.utils.switchElementsClass(as, class_low_light_mode);
		this.utils.invertElementsColor(as, this.low_light_mode);
		this.low_light_mode = !(this.low_light_mode);
	};
	// ---
	// Description: Called whenever the address field content changes.
	// ---
	Rslidy.prototype.onHashchange = function () {
		var displayed = window.location.href.split(this.url_delimiter)[1];
		var slide_index = displayed - 1;
		this.showSlide(slide_index);
	};
	// ---
	// Description: Called whenever the user begins to touch the body area.
	// e: Event.
	// ---
	Rslidy.prototype.onTouchstart = function (e) {
		// Register last tap
		var tap_previous = this.tap_last;
		this.tap_last = (new Date).getTime();
		var tap_delay = this.tap_last - tap_previous;
		// Toggle speaker notes on double tap
		if (tap_delay <= this.doubletap_delay) {
			this.toggleSpeakerNotes(e, false);
		}
		// Register touch event
		var touch = e.touches[0];
		// Set new values and reset old values
		this.start_x = touch.pageX;
		this.start_y = touch.pageY;
		this.delta_x = 0;
		this.delta_y = 0;
	};
	// ---
	// Description: Called whenever the user moves the finger while touching the body area.
	// e: Event.
	// ---
	Rslidy.prototype.onTouchmove = function (e) {
		// Update values
		var touch = e.touches[0];
		var delta_x_old = this.delta_x;
		this.delta_x = touch.pageX - this.start_x;
		this.delta_y = touch.pageY - this.start_y;
		// If the delta_x position has changed a lot, the user is swiping and the content does not need to be scrolled!
		if (Math.abs(this.delta_x - delta_x_old) > 10)
			e.preventDefault();
	};
	// ---
	// Description: Called whenever the stops touching the body area.
	// e: Event.
	// ---
	Rslidy.prototype.onTouchend = function (e) {
		// Register old values and calculate absolutes
		var touch_duration = (new Date).getTime() - this.tap_last;
		var delta_x = this.delta_x;
		var delta_y = this.delta_y;
		var delta_x_abs = Math.abs(delta_x);
		var delta_y_abs = Math.abs(delta_y);
		// Handle the swipe event if the touch duration was shorter than a specified threshold
		// Also, the movement should be mainly on the x axis (x_movement > this.swipe_y_limiter * y_movement)
		if (touch_duration < this.swipe_max_duration && (delta_x_abs > this.swipe_threshold || delta_y_abs > this.swipe_threshold)) {
			if (delta_x_abs > this.swipe_y_limiter * delta_y_abs) {
				this.shift_pressed = true;
				if (delta_x < 0)
					this.navNext();
				else
					this.navPrevious();
				this.shift_pressed = false;
				e.preventDefault(); // Seems to improve scrolling experience on iOS devices somehow
			}
		}
	};
	// ---
	// Description: Called whenever the orientation of a device changes.
	// e: Event.
	// ---
	Rslidy.prototype.onDeviceOrientation = function (e) {
		// Init if event was fired and necessary
		var checkbox_tilt = document.getElementById("checkbox-tilt");
		if (checkbox_tilt.disabled == true) {
			checkbox_tilt.disabled = false;
		}
		// Return if not activated
		if (checkbox_tilt.checked == false)
			return;
		// Store values
		var value_new = 0;
		if (window.innerHeight > window.innerWidth) {
			// Portrait mode
			value_new = Math.round(e.gamma);
		}
		else {
			// Landscape mode
			value_new = Math.round(e.beta);
		}
		var value_old = this.tilt_value_old;
		//var tilt_straight = e.beta;
		//var tilt_rot = e.alpha;
		var motion_now = (new Date).getTime();
		var motion_interval = Math.abs(motion_now - this.motion_last);
		var tilt_difference = value_new - this.tilt_value_old;
		var tilt_difference_threshold = 20.0 / this.tilt_sensitivity;
		this.shift_pressed = true;
		if (tilt_difference > tilt_difference_threshold && motion_interval > this.motion_break) {
			this.navNext();
			this.motion_last = motion_now;
		}
		else if (tilt_difference < -(tilt_difference_threshold) && motion_interval > this.motion_break) {
			this.navPrevious();
			this.motion_last = motion_now;
		}
		this.shift_pressed = false;
		// Set old value
		this.tilt_value_old = value_new;
	};
	// ---
	// Description: Called whenever the movement of the device changes (acceleration).
	// e: Event.
	// ---
	Rslidy.prototype.onDeviceMotion = function (e) {
		// Init if event was fired and necessary
		var checkbox_shake = document.getElementById("checkbox-shake");
		if (checkbox_shake.disabled == true) {
			checkbox_shake.disabled = false;
		}
		// Return if not activated
		if (checkbox_shake.checked == false)
			return;
		// Store values
		var acc_x = e.acceleration.x;
		var acc_y = e.acceleration.y;
		var acc_z = e.acceleration.z;
		var acc_threshold = 10.0 / this.shake_sensitivity;
		var motion_now = (new Date).getTime();
		var motion_interval = Math.abs(motion_now - this.motion_last);
		// Show first slide if shake is stronger than threshold
		if ((acc_x > acc_threshold || acc_y > acc_threshold || acc_z > acc_threshold) && motion_interval > this.motion_break) {
			this.showSlide(0);
			this.motion_last = motion_now;
		}
	};
	//
	// Slide navigation methods
	//
	// ---
	// Description: Returns the currently displayed slide index (0-indexed).
	// ---
	Rslidy.prototype.getCurrentSlideIndex = function () {
		var url_parts = window.location.href.split(this.url_delimiter);
		if (url_parts.length > 1) {
			var displayed = url_parts[1];
			return (displayed - 1);
		}
		return -1;
	};
	// ---
	// Description: Sets the currently displayed slide.
	// slide_index: The index of the slide (0-indexed).
	// from_init: Whether the call is coming from init or not (no need to set outside init function).
	// ---
	Rslidy.prototype.setCurrentSlide = function (slide_index, from_init) {
		// Out of bounds check
		if (slide_index < 0 || slide_index >= this.num_slides)
			return -1;
		// Set default value if not available
		from_init = from_init || false;
		var url_parts = window.location.href.split(this.url_delimiter);
		if (from_init == true && url_parts.length > 1) {
			var displayed = url_parts[1];
			slide_index = displayed;
		}
		else
			slide_index = slide_index + 1;
		// Set new slide number in address bar
		window.location.href = url_parts[0] + this.url_delimiter + slide_index;
		// Switch to slide
		this.showSlide(this.getCurrentSlideIndex());
		return 0;
	};
	// ---
	// Description: Hides all slides and shows specified slide then.
	// slide_index: The index of the slide (0-indexed).
	// ---
	Rslidy.prototype.showSlide = function (slide_index) {
		// Out of bounds check
		if (slide_index < 0 || slide_index >= this.num_slides)
			return -1;
		var old_index = this.getCurrentSlideIndex();
		// Hide all slides and remove selected effect
		var content_section = document.getElementById("content-section");
		
		var progress_bar = document.getElementById("progress-bar");
		//var progress_bar_indicator = document.getElementById("progress-bar-indicator");
		//progress_bar_indicator.style.left = 'calc(-0.8em + 100%*' + (slide_index + 1) / this.num_slides + ')';
		progress_bar.style.width = 'calc(100%*' + (slide_index + 1) / this.num_slides + ')';
	
		var original_slides = content_section.getElementsByClassName("slide");
		var slide_thumbnails = document.getElementsByClassName("slide-thumbnail");
		var url_parts = window.location.href.split(this.url_delimiter);
		for (var i = 0; i < original_slides.length; i++) {
			// for out animation of previous active slide 
			// showSlide triggers hashChange => showSlide is 2x triggered => i != slide_index
			// since it is 2x triggered a simple fix of i+/-1 is for keeping the correct previous slide to be animated
			// the additional Backwards and Forward is for complex animations needed
			if(!original_slides[i].classList.contains("hidden") && i != slide_index ||
				(original_slides[i].classList.contains("animate") && (i+1 == slide_index || i-1 == slide_index))){
				original_slides[i].classList.add("animate");
				if(old_index < slide_index){
					original_slides[i].classList.add("animatedForward");
					original_slides[i].classList.remove("animatedBackwards");
				}else if(old_index > slide_index){
					original_slides[i].classList.add("animatedBackwards");  
					original_slides[i].classList.remove("animatedForward");         
				}
			}
			else{
				original_slides[i].classList.remove("animate");
				if(slide_index != old_index){
					original_slides[i].classList.remove("animatedForward");
					original_slides[i].classList.remove("animatedBackwards");
				}
			}
			original_slides[i].classList.add("hidden");
			slide_thumbnails[i].classList.remove("slide-selected");
		}
		// Show specified slide and add selected effect
		original_slides[slide_index].classList.remove("hidden");
		if(old_index < slide_index){
			original_slides[slide_index].classList.add("animatedForward");
		}else if(old_index > slide_index){
			original_slides[slide_index].classList.add("animatedBackwards");           
		}
		slide_thumbnails[slide_index].classList.add("slide-selected");
		// Scroll to it in the overview, but only if the element is not already in the view (and decide on block start/end)
		var child = slide_thumbnails[slide_index];
		var parent = document.getElementById("overview");
		if (this.utils.childVisibleInParentScroll(child, parent) == false) {
			this.scroll_block_switch = (old_index < slide_index) ? false : true;
			slide_thumbnails[slide_index].scrollIntoView(this.scroll_block_switch);
		}
		// Hide speaker nodes
		this.toggleSpeakerNotes(null, true);
		// Set 1-indexed value and new url
		var slide_index_one_indexed = this.utils.toInt(slide_index) + 1;
		window.location.href = url_parts[0] + this.url_delimiter + slide_index_one_indexed;
		// Update slide caption
		var slide_caption = document.getElementById("slide-caption");
		slide_caption.innerHTML = " / " + this.num_slides;
		var slide_input = document.getElementById("slide-input");
		
		slide_input.value = slide_index_one_indexed;
		// Scroll to the top of this slide
		content_section.scrollTop = 0;
		
		//window.scrollTo(0, 0);
		
		return 0;
	};
	// ---
	//  Description: Initialization causes all slides to have animate attribute - so a simple loop to remove it was built
	// ---
	Rslidy.prototype.removeAnimation = function () {
		var original_slides = document.getElementById("content-section").getElementsByClassName("slide");
		for (var i = 0; i < original_slides.length; i++) {
			original_slides[i].classList.remove("animate");
			original_slides[i].classList.remove("animatedBackwards");
			original_slides[i].classList.remove("animatedForward");
		}
	};
	// ---
	// Description: Toggles speaker nodes for current slide if available.
	// e: Event coming from double tap, null otherwise.
	// always_hide: If true, speaker nodes are hidden regardless of the current status.
	// ---
	Rslidy.prototype.toggleSpeakerNotes = function (e, always_hide) {
		always_hide = always_hide || false;
		// Get current status
		var speaker_notes_overlay = document.getElementById("speakernotes-overlay");
		var hidden = speaker_notes_overlay.classList.contains("hidden");
		// Hide speaker notes if necessary
		if (hidden == false || always_hide == true) {
			speaker_notes_overlay.classList.add("hidden");
			// Prevent default double tap event if notes were visible
			if (e != null && hidden == false) {
				e.preventDefault();
				e.stopPropagation();
			}
			return;
		}
		// Get current speaker notes (if there are any)
		var content_section = document.getElementById("content-section");
		var current_slide = content_section.getElementsByClassName("slide")[this.getCurrentSlideIndex()];
		var speaker_notes = (current_slide.getElementsByClassName("speakernotes").length == 1) ? current_slide.getElementsByClassName("speakernotes")[0] : null;
		// Show speaker notes and set new text if necessary
		if (speaker_notes != null) {
			speaker_notes_overlay.classList.remove("hidden");
			speaker_notes_overlay.innerHTML = '<div class="speakernotes-container">' + speaker_notes.innerHTML + '</div>';
			// Prevent default double tap event if notes were hidden
			if (e != null && hidden == true) {
				e.preventDefault();
				e.stopPropagation();
			}
		}
	};
	// ---
	// Description: Returns the number of incremental list items on a slide.
	// slide_index: The index of the slide (0-indexed).
	// only_visible: Returns only the number of currently visible items (optional).
	// ---
	Rslidy.prototype.getNumIncrItems = function (slide_index, only_visible) {
		only_visible = only_visible || false;
		// Out of bounds check
		if (slide_index < 0 || slide_index >= this.num_slides)
			return -1;
		var content_section = document.getElementById("content-section");
		var slide = content_section.getElementsByClassName("slide")[slide_index];
		var incremental_items = slide.querySelectorAll('ul.incremental li');
		if (only_visible == false)
			return incremental_items.length;
		else {
			var counter = 0;
			for (var i = 0; i < incremental_items.length; i++) {
				if (incremental_items[i].classList.contains("invisible") == false)
					counter++;
			}
			return counter;
		}
	};
	// ---
	// Description: Returns the heading of a slide if available (or "slide" if not found).
	// slide_element: The slide element to get the heading from.
	// ---
	Rslidy.prototype.getSlideHeading = function (slide_element) {
		if (slide_element == null)
			return "";
		var slide_headers = slide_element.getElementsByTagName("h1");
		if (slide_headers.length > 0)
			return slide_headers[0].innerHTML;
		else
			return "slide";
	};
	// ---
	// Description: Jumps to the next slide (or next bullet point).
	// ---
	Rslidy.prototype.navNext = function () {
		var current_index = this.getCurrentSlideIndex();
		// Check for incremental items on current slide
		if (this.getNumIncrItems(current_index, false) > 0) {
			var num_incr_items = this.getNumIncrItems(current_index, false);
			var num_incr_items_shown = this.getNumIncrItems(current_index, true);
			if (num_incr_items > num_incr_items_shown) {
				if (this.shift_pressed == false)
					this.showItemsUpToN(num_incr_items_shown + 1);
				else
					this.showItemsUpToN(num_incr_items);
				return;
			}
		}
		// Change slide
		var new_index = current_index + 1;
		this.showSlide(new_index);
		// Check for incremental items on next slide
		if (this.getNumIncrItems(new_index, false) > 0) {
			var num_incr_items = this.getNumIncrItems(new_index, false);
			if (this.shift_pressed == false)
				this.showItemsUpToN(1);
			else
				this.showItemsUpToN(num_incr_items);
		}
	};
	// ---
	// Description: Jumps to the previous slide (or previous bullet point).
	// ---
	Rslidy.prototype.navPrevious = function () {
		var current_index = this.getCurrentSlideIndex();
		// Check for incremental items on current slide
		var num_incr_items_shown = this.getNumIncrItems(current_index, true);
		if (this.getNumIncrItems(current_index, false) > 0 && num_incr_items_shown > 1) {
			if (this.shift_pressed == false) {
				this.showItemsUpToN(num_incr_items_shown - 1);
				return;
			}
			else {
				this.showItemsUpToN(1);
				return;
			}
		}
		// Change slide
		var new_index = current_index - 1;
		this.showSlide(new_index);
		// Check for incremental items on previous slide
		if (this.getNumIncrItems(new_index, false) > 0) {
			var num_incr_items = this.getNumIncrItems(new_index, false);
			this.showItemsUpToN(num_incr_items);
		}
	};
	// ---
	// Description: Shows the first n bullet points and hides the rest.
	// n: Specifies the last incremental item to show.
	// ---
	Rslidy.prototype.showItemsUpToN = function (n) {
		var content_section = document.getElementById("content-section");
		var current_slide = content_section.getElementsByClassName("slide")[this.getCurrentSlideIndex()];
		var incr_items = current_slide.querySelectorAll("ul.incremental li");
		// Show items with index < n, hide items with index >= n
		var counter = 0;
		for (var i = 0; i < incr_items.length; i++) {
			if (counter < n)
				incr_items[i].classList.remove("invisible");
			else
				incr_items[i].classList.add("invisible");
			counter++;
		}
	};
	return Rslidy;
})();
// Class Utils
// Implements utility functions.
var Utils = (function () {
	// Methods
	// ---
	// Description: Constructor.
	// ---
	function Utils() {
		this.debug_enabled = true;
		this.debug_only_error = false;
		this.color_info = "#ffbb66";
		this.color_error = "#ff0000";
	}
	// ---
	// Description: A simple debug method, can be modified later if needed.
	// message: The string to be printed.
	// error: Whether it is an error or not (optional).
	// ---
	Utils.prototype.debug = function (message, error) {
		error = error || false;
		var color = (error == true) ? this.color_error : this.color_info;
		if (this.debug_enabled == false || (error == false && this.debug_only_error == true))
			return;
		var prefix = (error ? "[ERROR]" : "[DEBUG]");
		console.log("%c " + prefix + " " + message, "color: " + color + ";");
	};
	// ---
	// Description: Returns the width of the slide.
	// aspect_ratio: The desired aspect ratio (or 0 for dynamic calculation).
	// custom_width: The custom width.
	// ---
	Utils.prototype.getSlideWidth = function (aspect_ratio, custom_width) {
		aspect_ratio = aspect_ratio || 0;
		if (aspect_ratio == 0)
			return window.outerWidth;
		var width = custom_width; // ...
		return width;
	};
	// ---
	// Description: Returns the height of the slide.
	// aspect_ratio: The desired aspect ratio (or 0 for dynamic calculation).
	// custom_width: The custom width.
	// ---
	Utils.prototype.getSlideHeight = function (aspect_ratio, custom_width) {
		aspect_ratio = aspect_ratio || 0;
		if (aspect_ratio == 0)
			return window.outerHeight;
		var width = custom_width;
		var height = width / aspect_ratio;
		return height;
	};
	// ---
	// Description: Returns a copy of the input, with all line breaks removed.
	// text: The string to remove the line breaks from.
	// ---
	Utils.prototype.removeLineBreaks = function (text) {
		return text.replace(/(\r\n|\n|\r)/gm, "");
	};
	// ---
	// Description: Returns the current aspect ratio.
	// ---
	Utils.prototype.getCurrentAspectRatio = function () {
		var window_width = window.innerWidth;
		var window_height = window.innerHeight;
		var current_aspect_ratio = window_width / window_height;
		return current_aspect_ratio;
	};
	;
	// ---
	// Description: Gets the relative width of an element, with respect to the whole window.
	// element: Specifies the element to consider.
	// aspect_ratio: The desired aspect ratio (or 0 for dynamic calculation).
	// custom_width: The custom width.
	// ---
	Utils.prototype.getRelativeWidth = function (element, aspect_ratio, custom_width) {
		var window_width = (aspect_ratio == 0) ? window.outerWidth : custom_width;
		var element_width = element.clientWidth;
		var relative_width = element_width / window_width;
		return relative_width;
	};
	// ---
	// Description: Returns the integer representation of a character.
	// character: Specifies the character to convert.
	// ---
	Utils.prototype.toInt = function (character) {
		return 1 * character;
	};
	// ---
	// Description: Returns a 2-digit-representation of a number (e.g. "6" becomes "06", but "11" will still be "11").
	// num: Specify the number.
	// ---
	Utils.prototype.toTwoDigits = function (num) {
		return (("0" + num).slice(-2));
	};
	// ---
	// Description: Switches the existence of a class of each element in a specified list (ignores elements with class "ignore").
	// element_list: The list of elements.
	// class_name: The name of the class.
	// ---
	Utils.prototype.switchElementsClass = function (element_list, class_name) {
		for (var i = 0; i < element_list.length; i++) {
			if (element_list[i].classList.contains("ignore") == true)
				continue;
			if (element_list[i].classList.contains(class_name) == true)
				element_list[i].classList.remove(class_name);
			else
				element_list[i].classList.add(class_name);
		}
	};
	// ---
	// Description: Inverts the color attribute of all elements in the specified list.
	// element_list: The list of elements.
	// low_light_mode: Specified whether colors should be inverted or reset.
	// ---
	Utils.prototype.invertElementsColor = function (element_list, low_light_mode) {
		low_light_mode = low_light_mode || false;
		for (var i = 0; i < element_list.length; i++) {
			// Continue if night mode is to be disabled
			if (low_light_mode == true) {
				element_list[i].style.color = "";
				continue;
			}
			// Invert color
			var color_rgb = getComputedStyle(element_list[i]).getPropertyValue("color");
			var color_hex = "#";
			var rgx = /\d+/g;
			var match;
			while ((match = rgx.exec(color_rgb)) != null) {
				var inverted = 255 - match[0];
				if (inverted < 16)
					color_hex += "0";
				color_hex += inverted.toString(16);
			}
			element_list[i].style.color = color_hex;
		}
	};
	// ---
	// Description: Determines if a child element is currently fully visible in the scrollable area of a parent element.
	// ---
	Utils.prototype.childVisibleInParentScroll = function (child, parent) {
		var condition_1 = (child.offsetTop + child.clientHeight) > (parent.scrollTop + parent.clientHeight);
		var condition_2 = child.offsetTop < parent.scrollTop;
		if (condition_1 == true || condition_2 == true)
			return false;
		else
			return true;
	};
	return Utils;
})();

function openImageTabListeners(){
	var img = document.getElementById("zoomedImg");
	console.log(img);
	var titleElement = document.getElementById("zoomNumber");
	var zoomButtons = document.getElementsByTagName("button");
	var widthPer = img.naturalWidth / 100;
	var heightPer = img.naturalHeight / 100;

	var fitScreenPer = 90 * window.innerWidth / img.naturalWidth;
	fitScreenPer = Math.floor(fitScreenPer/10) * 10;
	titleElement.innerHTML = fitScreenPer;
	img.style.height = heightPer*fitScreenPer + "px";
	img.style.width =   widthPer*fitScreenPer + "px";


	console.log("ZOOM: " + fitScreenPer*100 +"W: " + img.naturalWidth+ " PER: "+ heightPer + " H: " + img.naturalHeight + " PER: "+ heightPer);

	for(var buttonID = 0; buttonID < zoomButtons.length; buttonID++){
		zoomButtons[buttonID].addEventListener("click", function(changeBy){
			var zoom = parseInt(titleElement.innerHTML);
			zoom = zoom + parseInt(this.innerHTML);
			if(zoom > 0){
				img.style.height = zoom * heightPer + "px";
				img.style.width = zoom * widthPer + "px";
				titleElement.innerHTML = zoom;
			}
		});
	};
	
	window.addEventListener('keypress', function (e) {
		if (e.key == '+' || e.key == '-' || e.key == '0') {
			var zoom = parseInt(titleElement.innerHTML);
			if(e.key == '+'){
				zoom = zoom + 10;
			}
			else if(e.key == '-')
			{
				zoom = zoom - 10;
			}
			else{
				zoom = 100;
			}
			if(zoom > 0){
				img.style.height = zoom * heightPer + "px";
				img.style.width = zoom * widthPer + "px";
				titleElement.innerHTML = zoom;
			}
		}
	}, false);

	var isCtrl = false;
	window.addEventListener('keydown', function (e) {
		if (e.which === 17) {
            isCtrl = true;
        }
    }, false);
	window.addEventListener('keyup', function (e) {
		if (e.which === 17) {
            isCtrl = false;
        }
    }, false);

	window.addEventListener("mousewheel", function (e) {
		if(isCtrl){
			var delta = Math.max(-1, Math.min(1, e.wheelDelta));
			var zoom = parseInt(titleElement.innerHTML);
			if(delta > 0){
				zoom = zoom + 10;
			}
			else if(delta < 0)
			{
				zoom = zoom - 10;
			}
			if(zoom > 0){
				img.style.height = zoom * heightPer + "px";
				img.style.width = zoom * widthPer + "px";
				titleElement.innerHTML = zoom;
			}
		}
	}, false);
}

function openImageTab(imgSrc) {
	var newWindow = window.open();
	
	var htmlCode ="<head><title>rSlidy Image View</title><link rel='stylesheet' href='css/reset.css'><link rel='stylesheet' href='css/normalise.css'>" +
			"<link rel='stylesheet' href='css/rslidy.css'><link rel='stylesheet' href='css/slides-default.css'></head>" +
			"<body><div class='slide imageAlert'><h1><button>-1000%</button><button>-100%</button><button>-10%</button>Zoom at <span id='zoomNumber'>100</span>%<button>+10%</button><button>+100%</button><button>+1000%</button></h1>" +
			"<div><img id='zoomedImg' src='"+ imgSrc + "'></div></div>"+
			"<script type='text/javascript'>" + String(openImageTabListeners) + "; openImageTabListeners();</script></body>";
	newWindow.document.write(htmlCode);
}
 

// ---
// Description: Enables the browser to first draw the loader, before initialization is started
// ---
function preload() {
	//Append the CSS loading animation placeholder to original body.
	var body_old = document.body.innerHTML
	document.body.innerHTML = '<div id="loader"><div>r</div><div>S</div><div>l</div><div>i</div><div>d</div><div>y</div></div>' + body_old;
	var loader = document.getElementById('loader');
 /*   loader.style.display = 'none';
	loader.offsetHeight; // no need to store this anywhere, the reference is enough
	loader.style.display='block';
	*/
}

function start() {
	var start = performance.now();
	// Append the loading animation placeholder at almost JS start
	preload();
	var rslidy = new Rslidy();
	// timeout allows the repaint to catch a break between preload and init
	setTimeout(function(){
		rslidy.init();
	}, 1);
}
if(window.onload == null)
	window.onload = start;
