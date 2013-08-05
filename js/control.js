control = {
    
    counter: 0,

    sections: {
        keys: [
            "artanddesign","books","business","commentisfree","crosswords",
            "culture","education","environment","fashion","film",
            "football","lifeandstyle","media","money","music",
            "politics","science","society","sport","stage",
            "technology","theguardian","theobserver","travel","tv-and-radio",
            "uk","world"
        ],
        dict:{
            "artanddesign":{"sectionName":"Art and design"},
            "books":{"sectionName":"Books"},
            "business":{"sectionName":"Business"},
            "commentisfree":{"sectionName":"Comment is free"},
            "crosswords":{"sectionName":"Crosswords"},
            "culture":{"sectionName":"Culture"},
            "education":{"sectionName":"Education"},
            "environment":{"sectionName":"Environment"},
            "fashion":{"sectionName":"Fashion"},
            "film":{"sectionName":"Film"},
            "football":{"sectionName":"Football"},
            "lifeandstyle":{"sectionName":"Life and style"},
            "media":{"sectionName":"Media"},
            "money":{"sectionName":"Money"},
            "music":{"sectionName":"Music"},
            "politics":{"sectionName":"Politics"},
            "science":{"sectionName":"Science"},
            "society":{"sectionName":"Society"},
            "sport":{"sectionName":"Sport"},
            "stage":{"sectionName":"Stage"},
            "technology":{"sectionName":"Technology"},
            "theguardian":{"sectionName":"From the Guardian"},
            "theobserver":{"sectionName":"From the Observer"},
            "travel":{"sectionName":"Travel"},
            "tv-and-radio":{"sectionName":"Television &amp; radio"},
            "uk":{"sectionName":"UK news"},
            "world":{"sectionName":"World news"}
        }
    },

    sources: {
        keys: ['theguardian.com', 'The Guardian', 'The Observer'],
        dict: {
                'theguardian.com': true,
                'The Guardian': true,
                'The Observer': true
            }
    },

    maxWords: 0,
    minWords: 999999999,


    init: function() {

        //  1st I need to add a bunch of stuff to the sections object
        $.each(control.sections.keys, function(i, key) {
            control.sections.dict[key].articleCount = {
                'theguardian.com': 0,
                'The Guardian': 0,
                'The Observer': 0
            };
            control.sections.dict[key].wordcount = {
                'theguardian.com': 0,
                'The Guardian': 0,
                'The Observer': 0
            };
        });

        this.fetchWordcount(1);

    },

    fetchWordcount: function(page) {

        var url = 'http://content.guardianapis.com/search?page-size=20&page=' + page + '&section=' + control.sections.keys.join('|') + '&format=json&show-fields=publication%2Cwordcount&show-tags=publication&date-id=date%2Flast7days&callback=?';
        $.getJSON(url)
        .success(
            function(json) {

                //  Now go thru the results popping the wordcount in the sections
                for (var i in json.response.results) {
                    
                    //  Find out if we need to toggle the publication to something else
                    if (json.response.results[i].tags.length > 0) {
                        json.response.results[i].fields.publication = json.response.results[i].tags[0].webTitle;
                    }

                    if (!(isNaN(parseInt(json.response.results[i].fields.wordcount, 10))) && json.response.results[i].fields.publication in control.sources.dict) {
                        control.sections.dict[json.response.results[i].sectionId].articleCount[json.response.results[i].fields.publication]++;
                        control.sections.dict[json.response.results[i].sectionId].wordcount[json.response.results[i].fields.publication] += parseInt(json.response.results[i].fields.wordcount, 10);
                    }
                }

                control.updateTable(json.response.total, json.response.pages, page);
                if (page < json.response.pages) {
                    page++;
                    //control.counter++;

                    $('#progress .bar').css('width', (page / json.response.pages * 100) + '%')

                    if (control.counter > 5) {
                        $('#progress').slideUp(666);
                    } else {
                        setTimeout( function() {
                            control.fetchWordcount(page);
                        }, 250);
                    }

                } else {
                    $('#progress').slideUp(666);
                }

            }
        )
        .error(
            function() {
                alert('Guardian API rate limit hit, try again in a short while (you can run this about 36 times in 24 hours with the "keyless" API rate limits).');
            }
        )

    },

    updateTable: function(total, pages, page) {

        if (total - page * 20 <= 0) {
            $('.progress').remove();
        } else {
            $('.progress').text('Scanning articles: ' + (total - page * 20));
        }

        var articleTotal = null;
        var wordcountTotal = null;

        var onlineWordcountTotal = 0;
        var guardianWordcountTotal = 0;
        var observerWordcountTotal = 0;

        var onlineArticleTotal = 0;
        var guardianArticleTotal = 0;
        var observerArticleTotal = 0;

        control.maxWords = 0;
        control.minWords = 999999999;

        $.each(control.sections.keys, function(i, value) {

            //  grab the wordcountTotal and articleTotal for this section
            wordcountTotal = control.sections.dict[value].wordcount['theguardian.com'] + control.sections.dict[value].wordcount['The Guardian'] + control.sections.dict[value].wordcount['The Observer'];
            articleTotal = control.sections.dict[value].articleCount['theguardian.com'] + control.sections.dict[value].articleCount['The Guardian'] + control.sections.dict[value].articleCount['The Observer'];

            //  update the totals for the online, guardian and observer values.
            onlineWordcountTotal += parseInt(control.sections.dict[value].wordcount['theguardian.com'], 10);
            guardianWordcountTotal += parseInt(control.sections.dict[value].wordcount['The Guardian'], 10);
            observerWordcountTotal += parseInt(control.sections.dict[value].wordcount['The Observer'], 10);

            //  and the same for articles
            onlineArticleTotal += parseInt(control.sections.dict[value].articleCount['theguardian.com'], 10);
            guardianArticleTotal += parseInt(control.sections.dict[value].articleCount['The Guardian'], 10);
            observerArticleTotal += parseInt(control.sections.dict[value].articleCount['The Observer'], 10);

            //  record the current max and min wordcounts
            if (wordcountTotal > control.maxWords) control.maxWords = wordcountTotal;
            if (wordcountTotal < control.minWords) control.minWords = wordcountTotal;

        });

        //  Update the running total for both
        var totalTotalWordcount = onlineWordcountTotal + guardianWordcountTotal + observerWordcountTotal;
        var totalTotalArticles = onlineArticleTotal + guardianArticleTotal + observerArticleTotal;

        //  Display the text at the top
        $('#total').html(utils.prettyNumber(totalTotalWordcount));
        $('#online div').html(utils.prettyNumber(onlineWordcountTotal));
        $('#print div').html(utils.prettyNumber(guardianWordcountTotal + observerWordcountTotal));

        $('#tashY').css('width', (onlineWordcountTotal / totalTotalWordcount * 100) + '%');
        $('#tash').css('width', (100 - (onlineWordcountTotal / totalTotalWordcount * 100)) + '%');

        $('#guardian div').html(utils.prettyNumber(guardianWordcountTotal));
        $('#observer div').html(utils.prettyNumber(observerWordcountTotal));

        $('#tashC').css('width', (guardianWordcountTotal / (guardianWordcountTotal + observerWordcountTotal) * 100) + '%');
        $('#tashM').css('width', 100 - (guardianWordcountTotal / (guardianWordcountTotal + observerWordcountTotal) * 100) + '%');
        

        //  Now go thru each section again drawing the pie charts
        $.each(control.sections.keys, function(i, value) {


            wordcountTotal = control.sections.dict[value].wordcount['theguardian.com'] + control.sections.dict[value].wordcount['The Guardian'] + control.sections.dict[value].wordcount['The Observer'];

            //  Work out the radius of the circle, it's going to be a base of 40px + the percentage we are between the lowest and
            //  highest values
            var percent = Math.floor((wordcountTotal - control.minWords) / (control.maxWords - control.minWords) * 100);
            var radius = percent + 36;

            var canvas = $('#' + value + ' canvas')[0];
            var context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);

            // shading
            context.beginPath();
            context.arc(canvas.width / 2, canvas.height / 2 + 1, radius, 0, 2 * Math.PI, false);
            context.fillStyle = '#EEEEEE';
            context.fill();

            context.beginPath();
            context.arc(canvas.width / 2, canvas.height / 2, radius, 0, 2 * Math.PI, false);
            context.fillStyle = '#FFF10B';
            context.fill();


            context.beginPath();
            context.moveTo(canvas.width/2,canvas.height/2);
            context.arc(canvas.width / 2, canvas.height / 2, radius, -(Math.PI/2), -(Math.PI/2) + (2 * Math.PI * control.sections.dict[value].wordcount['The Guardian'] / wordcountTotal), false);
            context.lineTo(canvas.width/2,canvas.height/2);
            context.fillStyle = '#0092D1';
            context.fill();

            context.beginPath();
            context.moveTo(canvas.width/2,canvas.height/2);
            context.arc(canvas.width / 2, canvas.height / 2, radius, -(Math.PI/2) + (2 * Math.PI * control.sections.dict[value].wordcount['The Guardian'] / wordcountTotal), -(Math.PI/2) + (2 * Math.PI * (control.sections.dict[value].wordcount['The Guardian'] + control.sections.dict[value].wordcount['The Observer']) / wordcountTotal), false);
            context.lineTo(canvas.width/2,canvas.height/2);
            context.fillStyle = '#CC006A';
            context.fill();

        });

    }

};

utils = {
    
    log: function(msg) {

        try {
            console.log(msg);
        } catch(er) {
            //  Nowt
        }
    },

    prettyNumber: function(nStr, sig) {

        if (isNaN(nStr)) return 0;

        nStr += '';
        x = nStr.split('.');
        x1 = x[0];
        var rgx = /(\d+)(\d{3})/;
        while (rgx.test(x1)) {
            x1 = x1.replace(rgx, '$1' + ',' + '$2');
        }

        if (x.length > 1 && sig > 0) {
            x2 = Math.round(x[1]/Math.pow(10, x[1].length) * Math.pow(10, sig));
            return x1 + '.' + x2;
        } else {
            return x1;
        }

    }

};