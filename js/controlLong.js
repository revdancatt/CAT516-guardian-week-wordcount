control = {
    
    sections: {
        keys: [],
        dict: {}
    },
    publicationSources: {
        keys: [],
        dict: {}
    },

    init: function() {
        this.fetchSections(1);
    },

    fetchSections: function(page) {

        //  go and get everything from the guardian for the last 7 weeks.
        var url = 'http://content.guardianapis.com/search?page-size=20&page=' + page + '&format=json&show-fields=publication%2Cwordcount&date-id=date%2Flast7days&callback=?';
        
        //  but not for sections we already know about
        if (this.sections.keys.length > 0) {
            url += '&section=-' + this.sections.keys.join(',-');
        }

        $.getJSON(url)
        .success(
            function(json) {

                //  Now go thru the results to see if we have found any new sections that are in the print edition
                var foundNewSection = false;
                for (var i in json.response.results) {

                    //  Do this to keep track of what publication sources exist...
                    if (!(json.response.results[i].fields.publication in control.publicationSources.dict)) {
                        control.publicationSources.keys.push(json.response.results[i].fields.publication);
                        control.publicationSources.keys.sort();
                        control.publicationSources.dict[json.response.results[i].fields.publication] = true;
                    }

                    //  if the publication type is *not* "guardian.co.uk" then lets make a note of
                    //  the section so we can ignore it the next time
                    if (json.response.results[i].fields.publication != 'guardian.co.uk' && !(json.response.results[i].sectionId in control.sections.dict)) {
                        foundNewSection = true;
                        control.sections.keys.push(json.response.results[i].sectionId);
                        control.sections.keys.sort();
                        control.sections.dict[json.response.results[i].sectionId] = json.response.results[i].sectionName;
                    }

                }

                //  update the display
                control.updateDisplay(json.response.total, json.response.pages, page);

                //  check to see if we found a new section, if we did then we do this again starting from page 1
                //  but we'll have a longer ignore list of sections
                if (foundNewSection) {
                    setTimeout( function() {
                        control.fetchSections(1);
                    }, 250);
                } else {

                    //  if we didn't find any more, then we need to start paging through the results
                    if (page < json.response.pages) {
                        page++;
                        setTimeout( function() {
                            control.fetchSections(page);
                        }, 250);
                    } else {
                        control.cleanUp();
                    }
                }


            }
        );

    },

    cleanUp: function() {

        //  Now that we know what sections exist and in what publications we can go and
        //  refetch all the content.
        //
        //  But first lets get rid of horrid looking stuff
        $('.feedback h1').text('Fetching wordcount for each section');
        $('.progress').empty();
        $('.sections').remove();
        $('.publications').remove();

        //  Now create the empty objects in the sections dict
        var newDict = {};
        $.each(control.sections.dict, function(key, value) {
            newDict[key] = {};
            newDict[key].sectionName = value;
            newDict[key].articleCount = {};
            newDict[key].wordCount = {};
            $.each(control.publicationSources.keys, function(i, v) {
                newDict[key].wordCount[v] = 0;
                newDict[key].articleCount[v] = 0;
            });
        });
        control.sections.dict = newDict;
        control.fetchWordcount(1);

    },

    //  This goes off to the guardian and fetches all the results from the last 7 days for the
    //  sections we know about.
    fetchWordcount: function(page) {

        var url = 'http://content.guardianapis.com/search?page-size=20&page=' + page + '&section=' + control.sections.keys.join('|') + '&format=json&show-fields=publication%2Cwordcount&date-id=date%2Flast7days&callback=?';
        $.getJSON(url)
        .success(
            function(json) {

                //  Now go thru the results popping the wordcount in the sections
                for (var i in json.response.results) {
                    if (!(isNaN(parseInt(json.response.results[i].fields.wordcount, 10)))) {
                        control.sections.dict[json.response.results[i].sectionId].articleCount[json.response.results[i].fields.publication]++;
                        control.sections.dict[json.response.results[i].sectionId].wordCount[json.response.results[i].fields.publication] += parseInt(json.response.results[i].fields.wordcount, 10);
                    }
                }

                control.updateTable(json.response.pages, page);
                if (page < json.response.pages) {
                    page++;
                    setTimeout( function() {
                        control.fetchWordcount(page);
                    }, 250);
                } else {
                    utils.log('DONE!!!');
                }

            }
        );


    },

    updateDisplay: function(total, pages, page) {

        //  show the records left to scan
        $('.progress').text('Scanning page ' + page + ' of ' + pages + ' of the remaining  ' +  total + ' records.');

        //  update the sections
        $('.sections ul').empty();
        $.each(control.sections.keys, function(i, value) {
            $('.sections ul').append($('<li>').html(control.sections.dict[value]));
        });

        //  update the publications
        $('.publications ul').empty();
        $.each(control.publicationSources.keys, function(i, value) {
            $('.publications ul').append($('<li>').html(value));
        });

        utils.log(total);
    },

    updateTable: function(pages, page) {
        $('.progress').text('Scanning page ' + page + ' of ' + pages + '.');

        var tbl = $('<table>')
        .append(
            $('<tr>').addClass('header')
            .append($('<td>').html('Section'))
            .append($('<td>').html('Online Only'))
            .append($('<td>').html('The Guardian'))
            .append($('<td>').html('The Observer'))
        );

        var articleTotal = null;
        var wordcountTotal = null;

        var onlineWordcountTotal = 0;
        var guardianWordcountTotal = 0;
        var observerWordcountTotal = 0;

        var onlineArticleTotal = 0;
        var guardianArticleTotal = 0;
        var observerArticleTotal = 0;

        $.each(control.sections.keys, function(i, value) {
            articleTotal = 0;
            wordcountTotal = 0;
            tbl.append(
                $('<tr>')
                .append( $('<td>').html(control.sections.dict[value].sectionName) )
                .append( $('<td>').html(control.sections.dict[value].wordCount['guardian.co.uk'] + ' words<br />' + control.sections.dict[value].articleCount['guardian.co.uk'] + ' articles') )
                .append( $('<td>').html(control.sections.dict[value].wordCount['The Guardian'] + ' words<br />' + control.sections.dict[value].articleCount['The Guardian'] + ' articles') )
                .append( $('<td>').html(control.sections.dict[value].wordCount['The Observer'] + ' words<br />' + control.sections.dict[value].articleCount['The Observer'] + ' articles') )
                .append( $('<td>').html(
                        (
                            control.sections.dict[value].wordCount['guardian.co.uk'] +
                            control.sections.dict[value].wordCount['guardian.co.uk'] +
                            control.sections.dict[value].wordCount['The Observer']
                        ) + ' words<br />' +
                        (
                            control.sections.dict[value].articleCount['guardian.co.uk'] +
                            control.sections.dict[value].articleCount['guardian.co.uk'] +
                            control.sections.dict[value].articleCount['The Observer']
                        ) + ' articles'
                    )
                )
            );

            onlineWordcountTotal += parseInt(control.sections.dict[value].wordCount['guardian.co.uk'], 10);
            guardianWordcountTotal += parseInt(control.sections.dict[value].wordCount['The Guardian'], 10);
            observerWordcountTotal += parseInt(control.sections.dict[value].wordCount['The Observer'], 10);

            onlineArticleTotal += parseInt(control.sections.dict[value].articleCount['guardian.co.uk'], 10);
            guardianArticleTotal += parseInt(control.sections.dict[value].articleCount['The Guardian'], 10);
            observerArticleTotal += parseInt(control.sections.dict[value].articleCount['The Observer'], 10);

        });

        tbl.append(
            $('<tr>')
            .append( $('<td>').html('Totals') )
            .append( $('<td>').html(onlineWordcountTotal + ' words<br />' + onlineArticleTotal + ' articles') )
            .append( $('<td>').html(guardianWordcountTotal + ' words<br />' + guardianArticleTotal + ' articles') )
            .append( $('<td>').html(observerWordcountTotal + ' words<br />' + observerArticleTotal + ' articles') )
            .append( $('<td>').html(
                    (
                        onlineWordcountTotal +
                        guardianWordcountTotal +
                        observerWordcountTotal
                    ) + ' words<br />' +
                (
                        onlineArticleTotal +
                        guardianArticleTotal +
                        observerArticleTotal
                    ) + ' articles'
                )
            )
        );

        $('.wordcounts').empty().append(tbl);

    }

};


// time ago = (new Date() - new Date(t))/1000/60

utils = {
    
    log: function(msg) {

        try {
            console.log(msg);
        } catch(er) {
            //  Nowt
        }
    }

};