$(document).ready(function () {
          setTimeout(function () {
               
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
    
          }, 100);
    });