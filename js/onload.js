// Copyright (c) 2012 Thumbtack, Inc.

jQuery(function() {
    // override default result colors for charts
    Abba.RESULT_COLORS = {
        neutral: '#B8B8B8',
        lose: '#B42647',
        win: '#26B43C'
    };

    var presenter = new Abba.Presenter(Abba.Abba);
    presenter.bind(
        new Abba.InputsView(jQuery('.inputs'), document.getElementById('hidden-iframe')),
        jQuery('.results')
    );

    var experiments = jQuery("#experiments");
    var dateFetching = jQuery("#dateFetching");
    var categories = jQuery("#categories");
    var goals = jQuery("#goals");
    var jsonExperiments, jsonData;
    var urlExperiments = Drupal.settings.splitest.modulePath+"/data/wemove.list.json";
    var urlData = Drupal.settings.splitest.modulePath+"/data/wemove.json";
    var mapExperiments = [];
    var jsonContent = [];
    var nVariants = 0, nRows = 0;
    var goalsList = [];

    jQuery.ajax({
      url: urlExperiments, 
      dataType: "json",
      success: function(data) {
        jsonExperiments = data;
        jQuery.each(data, function(i, val) {
            experiments.append(jQuery('<option />', { value: val.name, text: val.name }));
            mapExperiments[val.name] = i;
        });
      }
    });

    jQuery.ajax({
      url: urlData, 
      dataType: "json",
      success: function(data) {
        jsonData = data;
      }
    });

    experiments.change(function(e) {
        var exp = this.value;
        jsonContent = {};
        if (exp == '0') {
            dateFetching.text('');
            categories.text('');
            goals.text('');
        } else {
            dateFetching.text(jsonExperiments[mapExperiments[exp]].dateFetching);
            categories.text(jsonExperiments[mapExperiments[exp]].categories.join(', '));
            /* Sum by categories and goals */
            for (var c in jsonData) {
                for (var e in jsonData[c].experiments) {
                    if (jsonData[c].experiments[e].name == exp) {
                        for (var v in jsonData[c].experiments[e].variants) {
                            /* how many views by variants */
                            if (jsonContent[v] && jsonContent[v]['number_of_trials']) {
                                jsonContent[v]['number_of_trials'] = jsonData[c].experiments[e].variants[v]*1 + jsonContent[v]['number_of_trials']*1;
                            } else {
                                jsonContent[v] = {'number_of_trials' : jsonData[c].experiments[e].variants[v]*1, 'number_of_successes' : 0};    
                            }
                        }


                        for (var g in jsonData[c].experiments[e].goals) {                            
                            /* how many goals linked to current experiment. Sum of all goals! */
                            for (var gv in jsonData[c].experiments[e].goals[g]) {
                                if ('number_of_successes' in jsonContent[gv]) {
                                    jsonContent[gv]['number_of_successes'] = jsonData[c].experiments[e].goals[g][gv]*1 + jsonContent[gv]['number_of_successes'];
                                    goalsList[g] = g;
                                }
                            }
                        }
                    }
                }
            }
            goals.text(Object.keys(goalsList).join(', '));

            
            nVariants = Object.keys(jsonContent).length;
            nRows = jQuery(".input-row").length;
            if (nRows < nVariants) {
                i = nRows;
                while (i < nVariants) {
                    jQuery('tbody.inputs-table').append('<tr class="input-row"><td><input type="text" class="label-input" value="Variation" required /></td><td><input type="text" class="num-successes-input" required /></td><td><input type="text" class="num-samples-input" required /></td><td><a href="#" class="remove-input-link">Remove</a></td></tr>');
                    i++;
                }
            } else if (nRows > nVariants) {
                jQuery(".input-row").each(function(index) {
                    if (index+1 > nVariants) {
                        jQuery(this).remove();
                    }
                });
            }

            var i = 0;
            for (var variant in jsonContent) {
                if (i == 0) {
                    jQuery(".input-row.baseline-input-row input.label-input").val(variant);
                    jQuery(".input-row.baseline-input-row input.num-successes-input").val(jsonContent[variant].number_of_successes);
                    jQuery(".input-row.baseline-input-row input.num-samples-input").val(jsonContent[variant].number_of_trials);
                } else {
                    jQuery(".input-row:not(.baseline-input-row):nth-child("+(i+1)+") input.label-input").val(variant);
                    jQuery(".input-row:not(.baseline-input-row):nth-child("+(i+1)+") input.num-successes-input").val(jsonContent[variant].number_of_successes);
                    jQuery(".input-row:not(.baseline-input-row):nth-child("+(i+1)+") input.num-samples-input").val(jsonContent[variant].number_of_trials);
                }
                i++;
            }

        }
    });

});
