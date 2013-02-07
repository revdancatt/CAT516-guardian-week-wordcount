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
            "law":{"sectionName":"Law"},
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
        keys: ['guardian.co.uk', 'The Guardian', 'The Observer'],
        dict: {
                'guardian.co.uk': true,
                'The Guardian': true,
                'The Observer': true
            }
    },


    init: function() {

        //  1st I need to add a bunch of stuff to the sections object
        $.each(control.sections.keys, function(i, key) {
            control.sections.dict[key].articleCount = {
                'guardian.co.uk': 0,
                'The Guardian': 0,
                'The Observer': 0
            };
            control.sections.dict[key].wordcount = {
                'guardian.co.uk': 0,
                'The Guardian': 0,
                'The Observer': 0
            };
        });

        this.fetchWordcount(1);

    },

    fetchWordcount: function(page) {

        var url = 'http://content.guardianapis.com/search?page-size=20&page=' + page + '&section=' + control.sections.keys.join('|') + '&format=json&show-fields=publication%2Cwordcount&date-id=date%2Flast7days&callback=?';
        $.getJSON(url)
        .success(
            function(json) {

                //  Now go thru the results popping the wordcount in the sections
                for (var i in json.response.results) {
                    if (!(isNaN(parseInt(json.response.results[i].fields.wordcount, 10))) && json.response.results[i].fields.publication in control.sources.dict) {
                        control.sections.dict[json.response.results[i].sectionId].articleCount[json.response.results[i].fields.publication]++;
                        control.sections.dict[json.response.results[i].sectionId].wordcount[json.response.results[i].fields.publication] += parseInt(json.response.results[i].fields.wordcount, 10);
                    }
                }

                control.updateTable(json.response.total, json.response.pages, page);
                if (page < json.response.pages) {
                    page++;
                    control.counter++;

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
        );

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

        /*
        var tbl = $('<table>')
        .append(
            $('<tr>').addClass('header')
            .append($('<td>').html('Section').addClass('sectionName'))
            .append($('<td>').html('Online Only'))
            .append($('<td>').html('The Guardian'))
            .append($('<td>').html('The Observer'))
            .append($('<td>').html('Totals'))
        );
        */

        $.each(control.sections.keys, function(i, value) {

            wordcountTotal = control.sections.dict[value].wordcount['guardian.co.uk'] + control.sections.dict[value].wordcount['The Guardian'] + control.sections.dict[value].wordcount['The Observer'];
            articleTotal = control.sections.dict[value].articleCount['guardian.co.uk'] + control.sections.dict[value].articleCount['The Guardian'] + control.sections.dict[value].articleCount['The Observer'];

            /*
            tbl.append(
                $('<tr>')
                .append( $('<td>').addClass('sectionName').html(control.sections.dict[value].sectionName) )
                .append( $('<td>').html(utils.prettyNumber(control.sections.dict[value].wordcount['guardian.co.uk'], 0) + ' words<br />' +
                    utils.prettyNumber(control.sections.dict[value].articleCount['guardian.co.uk'], 0) + ' articles<br />' +
                    utils.prettyNumber(control.sections.dict[value].wordcount['guardian.co.uk'] / control.sections.dict[value].articleCount['guardian.co.uk'], 0) + ' w/a<br />' +
                    utils.prettyNumber(control.sections.dict[value].wordcount['guardian.co.uk'] / wordcountTotal * 100, 2) + '% words<br />' +
                    utils.prettyNumber(control.sections.dict[value].articleCount['guardian.co.uk'] / articleTotal * 100, 2) + '% articles<br />' +
                    utils.prettyNumber(control.sections.dict[value].wordcount['guardian.co.uk'] / 7, 0) + ' words/day<br />' +
                    utils.prettyNumber(control.sections.dict[value].articleCount['guardian.co.uk'] / 7, 2) + ' art/day')
                    )

                .append( $('<td>').html(utils.prettyNumber(control.sections.dict[value].wordcount['The Guardian'], 0) + ' words<br />' +
                    utils.prettyNumber(control.sections.dict[value].articleCount['The Guardian'], 0) + ' articles<br />' +
                    utils.prettyNumber(control.sections.dict[value].wordcount['The Guardian'] / control.sections.dict[value].articleCount['The Guardian'], 0) + ' w/a<br />' +
                    utils.prettyNumber(control.sections.dict[value].wordcount['The Guardian'] / wordcountTotal * 100, 2) + '% words<br />' +
                    utils.prettyNumber(control.sections.dict[value].articleCount['The Guardian'] / articleTotal * 100, 2) + '% articles<br />' +
                    utils.prettyNumber(control.sections.dict[value].wordcount['The Guardian'] / 6, 0) + ' words/day<br />' +
                    utils.prettyNumber(control.sections.dict[value].articleCount['The Guardian'] / 6, 2) + ' art/day')
                    )

                .append( $('<td>').html(utils.prettyNumber(control.sections.dict[value].wordcount['The Observer'], 0) + ' words<br />' +
                    utils.prettyNumber(control.sections.dict[value].articleCount['The Observer'], 0) + ' articles<br />' +
                    utils.prettyNumber(control.sections.dict[value].wordcount['The Observer'] / control.sections.dict[value].articleCount['The Observer'], 0) + ' w/a<br />' +
                    utils.prettyNumber(control.sections.dict[value].wordcount['The Observer'] / wordcountTotal * 100, 2) + '% words<br />' +
                    utils.prettyNumber(control.sections.dict[value].articleCount['The Observer'] / articleTotal * 100, 2) + '% articles<br />' +
                    utils.prettyNumber(control.sections.dict[value].wordcount['The Observer'] / 1, 0) + ' words/day<br />' +
                    utils.prettyNumber(control.sections.dict[value].articleCount['The Observer'] / 1, 2) + ' art/day')
                )

                .append( $('<td>').html(utils.prettyNumber(wordcountTotal, 0) + ' words<br />' +
                    utils.prettyNumber(articleTotal, 0) +  ' articles<br />' +
                    utils.prettyNumber(wordcountTotal / articleTotal, 0) + ' w/a<br />' +
                    '100% words<br />' +
                    '100% articles<br />' +
                    utils.prettyNumber(wordcountTotal / 7, 2) + ' words/day<br />' +
                    utils.prettyNumber(articleTotal / 7, 2) + ' art/day<br />' +
                    '<br />' )
                )
            );
            */

            onlineWordcountTotal += parseInt(control.sections.dict[value].wordcount['guardian.co.uk'], 10);
            guardianWordcountTotal += parseInt(control.sections.dict[value].wordcount['The Guardian'], 10);
            observerWordcountTotal += parseInt(control.sections.dict[value].wordcount['The Observer'], 10);

            onlineArticleTotal += parseInt(control.sections.dict[value].articleCount['guardian.co.uk'], 10);
            guardianArticleTotal += parseInt(control.sections.dict[value].articleCount['The Guardian'], 10);
            observerArticleTotal += parseInt(control.sections.dict[value].articleCount['The Observer'], 10);

        });

        var totalTotalWordcount = onlineWordcountTotal + guardianWordcountTotal + observerWordcountTotal;
        var totalTotalArticles = onlineArticleTotal + guardianArticleTotal + observerArticleTotal;

        $('#total').html(utils.prettyNumber(totalTotalWordcount));
        $('#online div').html(utils.prettyNumber(onlineWordcountTotal));
        $('#print div').html(utils.prettyNumber(guardianWordcountTotal + observerWordcountTotal));

        $('#tashY').css('width', (onlineWordcountTotal / totalTotalWordcount * 100) + '%');
        $('#tash').css('width', (100 - (onlineWordcountTotal / totalTotalWordcount * 100)) + '%');

        $('#guardian div').html(utils.prettyNumber(guardianWordcountTotal));
        $('#observer div').html(utils.prettyNumber(observerWordcountTotal));

        $('#tashC').css('width', (guardianWordcountTotal / (guardianWordcountTotal + observerWordcountTotal) * 100) + '%');
        $('#tashM').css('width', 100 - (guardianWordcountTotal / (guardianWordcountTotal + observerWordcountTotal) * 100) + '%');
        
        /*
        tbl.append(
            $('<tr>')
            .append( $('<td>').html('Totals').addClass('sectionName') )
            .append( $('<td>').html(utils.prettyNumber(onlineWordcountTotal, 0) + ' words<br />' +
                utils.prettyNumber(onlineArticleTotal, 0) + ' articles<br />' +
                utils.prettyNumber(onlineWordcountTotal / onlineArticleTotal, 0) + ' w/a<br />' +
                utils.prettyNumber(onlineWordcountTotal / totalTotalWordcount * 100, 2) + '% words<br />' +
                utils.prettyNumber(onlineArticleTotal / totalTotalArticles * 100, 2) + '% articles<br />' +
                utils.prettyNumber(onlineWordcountTotal / 7, 0) + ' words/day<br />' +
                utils.prettyNumber(onlineArticleTotal / 7, 2) + ' art/day<br />'
                )
            )

            .append( $('<td>').html(utils.prettyNumber(guardianWordcountTotal, 0) + ' words<br />' +
                utils.prettyNumber(guardianArticleTotal, 0) + ' articles<br />' +
                utils.prettyNumber(guardianWordcountTotal / guardianArticleTotal, 0) + ' w/a<br />' +
                utils.prettyNumber(guardianWordcountTotal / totalTotalWordcount * 100, 2) + '% words<br />' +
                utils.prettyNumber(guardianArticleTotal / totalTotalArticles * 100, 2) + '% articles<br />' +
                utils.prettyNumber(guardianWordcountTotal / 6, 0) + ' words/day<br />' +
                utils.prettyNumber(guardianArticleTotal / 6, 2) + ' art/day<br />'
                )
            )

            .append( $('<td>').html(utils.prettyNumber(observerWordcountTotal, 0) + ' words<br />' +
                utils.prettyNumber(observerArticleTotal, 0) + ' articles<br />' +
                utils.prettyNumber(observerWordcountTotal / observerArticleTotal, 0) + ' w/a<br />' +
                utils.prettyNumber(observerWordcountTotal / totalTotalWordcount * 100, 2) + '% words<br />' +
                utils.prettyNumber(observerArticleTotal / totalTotalArticles * 100, 2) + '% articles<br />' +
                utils.prettyNumber(observerWordcountTotal / 1, 0) + ' words/day<br />' +
                utils.prettyNumber(observerArticleTotal / 1, 2) + ' art/day<br />'
                )
            )

            .append( $('<td>').html(utils.prettyNumber(totalTotalWordcount, 0) + ' words<br />' +
                utils.prettyNumber(totalTotalArticles, 0) + ' articles<br />' +
                utils.prettyNumber(totalTotalWordcount / totalTotalArticles, 0) + ' w/a<br />' +
                '100% words<br />' +
                '100% articles<br />' +
                utils.prettyNumber(totalTotalWordcount / 7, 0) + ' words/day<br />' +
                utils.prettyNumber(totalTotalArticles / 7, 2) + ' art/day<br />' +
                '<br />'
                )
            )
        );

        $('.wordcounts').empty().append(tbl);
        */

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