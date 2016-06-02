
var ajaxQueue={};
var ajaxLock=0;
var ajaxLockGroup=0;
var ajaxResultCache={};

$( document ).ajaxStop(function() {
    ajaxLock=0;
    ajaxLockGroup=0;
});

/**
 *
 * @param ajaxGroup
 * @param lockValue 0-none,1-group,2-element
 * @param ajaxOverride 0-none,1-group,2-element
 * @param data
 * @param requestToken
 * @param uri
 * @param prefix
 * @param elem
 */
function dispatchAjax(data,requestToken,uri,prefix,callback,ajaxGroup,lockValue,ajaxOverride){
    var xhr=null;
    switcherou=""+ajaxLock+ajaxOverride;
    switch (switcherou){
        case "22": //all locked ,abort all
        case "21": //all locked ,abort group
        case "20": //all locked ,abort none
        case "11": //group locked ,abort group
            break;
        case "10": //group locked ,abort none
            if(ajaxLockGroup==ajaxGroup)
                xhr=doAjax(ajaxGroup,lockValue,data,requestToken,uri,prefix,callback);
            break;
        case "12": //group locked ,abort all
        case "02": //none locked ,abort all
            if(Object.keys(ajaxQueue).length!=0) {
                Object.keys(ajaxQueue).forEach(function (key) {
                    if (Object.keys(ajaxQueue[key]).length != 0
                        && key!=ajaxGroup
                    )
                        Object.keys(ajaxQueue[key]).forEach(function (id) {
                            xhr=ajaxQueue[key][id];
                            xhr.abort();
                        });
                    delete ajaxQueue[key];
                });
            }
            xhr=doAjax(ajaxGroup,lockValue,data,requestToken,uri,prefix,callback);
            break;
        case "01": //none locked ,abort group (if no group do call
            if(typeof ajaxQueue[ajaxGroup]=="object" && Object.keys(ajaxQueue[ajaxGroup]).length!=0) {
                Object.keys(ajaxQueue[ajaxGroup]).forEach(function (id) {
                    xhr = ajaxQueue[ajaxGroup][id];
                    xhr.abort();
                    delete ajaxQueue[ajaxGroup][id];
                });
            }
            xhr=doAjax(ajaxGroup,lockValue,data,requestToken,uri,prefix,callback)
            break;
        case "00": //none locked ,abort none
            xhr=doAjax(ajaxGroup,lockValue,data,requestToken,uri,prefix,callback);
            break;
        default :
            break;
    }
    return xhr;
}

function doAjax(ajaxGroup,lockValue,data,requestToken,uri,prefix,callback){
    ajaxLock=lockValue;
    ajaxLockGroup=ajaxGroup;

    var ajaxID=parseInt(Math.random() * (1001 - 1) + 1);
    ajaxID= ('000'+ajaxID).slice(-4);


    data["REQUEST_TOKEN"] = requestToken;
    data["AJAX_TOKEN"] = prefix;
    data["REQUEST_ID"] =ajaxID;
    data["REQUEST_GROUP"]=ajaxGroup;

    var xhr = $.post(
        uri,
        data
        //no callback use ajaxSuccess
    ).fail(function (jqXhr, textStatus, errorThrown) {

            if(textStatus=="error" && errorThrown=="");
            errorThrown="Ajax-request "+data["AJAX_TOKEN"]+"-"+data["REQUEST_ID"]+" aborted";
            console.log(errorThrown);

        }).success(function(respText) {
            var jsonResponse = parseJsonResult(xhr);
            if(jsonResponse.hasOwnProperty("AJAX_TOKEN") && jsonResponse["AJAX_TOKEN"]==prefix && callback!=undefined)
                callback(jsonResponse);
            if(jsonResponse.hasOwnProperty("REQUEST_ID"))
                id =jsonResponse["REQUEST_ID"];
            else
                id="000";
            if(jsonResponse.hasOwnProperty("REQUEST_GROUP")) {
                group = jsonResponse["REQUEST_GROUP"];

                if(ajaxQueue[group]!=undefined){
                    delete ajaxQueue[group][id];
                    if (Object.keys(ajaxQueue[group]).length == 0)
                        delete ajaxQueue[group];
                }
            }else
                console.log(prefix+"-Ajax request ended("+id+") with false response");

            //console.log(prefix+"-Ajax request ended("+id+")");

        });
    if(ajaxQueue[ajaxGroup]==undefined)
        ajaxQueue[ajaxGroup]={};
    ajaxQueue[ajaxGroup][ajaxID]=xhr;

    return xhr;
}

function parseJsonResult(xhr){
    var res={};
    try{
        res = JSON && JSON.parse(xhr.responseText) || jQuery.parseJSON(xhr.responseText);
    }catch (err){
        console.log("json Parse Error!");
        // window.location.reload(true);
    }
    return res;
}


/**
 * Toogle the ajax loading animation on Elements which:
 * have another element with the class="progressBar" inside!!!
 * @param state
 */
$.fn.toggleProgressBar = function(state,direct) {
    switch (state) {
        case 'toggle':
            if(!direct)
                $(this).find(".progressBar").toggleClass("loader");
            else
                $(this).toggleClass("loader");
            break;
        case'off':
            if(!direct)
                $(this).find(".progressBar").removeClass("loader");
            else
                $(this).removeClass("loader");
            break;
        case'on':
            if(!direct)
                $(this).find(".progressBar").empty().addClass("loader");
            else
                $(this).empty().addClass("loader");
            break;
    }
}

//$(document).ready(function () {
//
//      if($("#nav_error").length==0) {
//        $("#run_page").toggleProgressBar("on");
//        $("#run_page").fadeIn(animationTime * 2);
//    }
//
//
//
//    $(document).ajaxSend(function (event, jqxhr, settings) {
//    //copy for OnSend Listener use settings.data
//    });
//});

//$(document).ajaxSuccess(function (event, xhr, settings) {
//    var jsonResponse = JSON && JSON.parse(xhr.responseText) || jQuery.parseJSON(xhr.responseText);
//    if (jsonResponse.hasOwnProperty("res")) {
//        if(ajaxResultCache["res"]==undefined)
//            ajaxResultCache["res"]={};
//        if (Object.keys(jsonResponse["res"]).length == 0) {
//            $("#run_page").clear();
//            $("#to_page").clear();
//        } else {
////                   $("#run_page h2").empty();
////                   $("#to_page h2").empty();
//            if (jsonResponse["res"].hasOwnProperty("tobj")) {
//                if(ajaxResultCache["res"]["tobj"]==undefined)
//                    ajaxResultCache["res"]["tobj"]={};
//
//
//                if (jsonResponse["res"]["tobj"].hasOwnProperty("desc")) {
//                    $("#to_desc").toggleProgress('off');
//                    $("#to_desc").clear();
//                    to_doDesc(jsonResponse["res"]["tobj"]["desc"]);
//                }
//                if (jsonResponse["res"]["tobj"].hasOwnProperty("res")) {
//                    ajaxResultCache["res"]["tobj"]["res"]=jsonResponse["res"]["tobj"]["res"];
//                    $("#to_res").toggleProgress('off');
//                    $("#to_res").clear();
//                    to_doRes(jsonResponse["res"]["tobj"]["res"]);
//                }
//                if (jsonResponse["res"]["tobj"].hasOwnProperty("hist")) {
//                    ajaxResultCache["res"]["tobj"]["hist"]=jsonResponse["res"]["tobj"]["hist"];
//                    $("#to_hist").toggleProgress('off');
//                    $("#to_hist").clear();
//                    to_doHist(jsonResponse["res"]["tobj"]["hist"]);
//                }
//            }
//            if (jsonResponse["res"].hasOwnProperty("run")) {
//                if(ajaxResultCache["res"]["run"]==undefined)
//                    ajaxResultCache["res"]["run"]={};
//
//                if (jsonResponse["res"]["run"].hasOwnProperty("desc")) {
//                    $("#run_desc").toggleProgress('off');
//                    $("#run_desc").clear();
//                    run_doDesc(jsonResponse["res"]["run"]["desc"]);
//                }
//                if (jsonResponse["res"]["run"].hasOwnProperty("tobj")) {
//                    $("#run_tobj").toggleProgress('off');
//                    $("#run_tobj").clear();
//                    run_tobj(jsonResponse["res"]["run"]["tobj"]);
//                }
//                if (jsonResponse["res"]["run"].hasOwnProperty("hist")) {
//                    ajaxResultCache["res"]["run"]["hist"]=jsonResponse["res"]["run"]["hist"];
//                    $("#run_hist").toggleProgress('off');
//                    $("#run_hist").clear();
//                    run_doHist(jsonResponse["res"]["run"]["hist"]);
//                }
//            }
//        }
//    }
//
//});



