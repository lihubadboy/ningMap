/**
 * @author DYTH 2015
 */

var baseOprUrl = "http://124.17.4.31:8080/dbas2region";
var configOptions = {
    "authorInfoKey": "authorInfo",
    "style": "normal", //normal,dark,midnight,grayscale...
    "city": "西安",
    "showBound": false,
    "zoomlevel": 6,
    "proxyUrl": "app/proxy/proxy.jsp",
    "publicUrl": "http://www.gb18306.cn/",
    "isLogin": true,
    "LoginUrls": {
        "url": "http://124.17.4.31:8080/dbas2region/authentication/localbureau/login"
    },
    "thumbnailBaseUrl": baseOprUrl + "/",
    "OprUrls": {
        "building": {
            "queryUrl": baseOprUrl + "/building/query",
            "deleteUrl": baseOprUrl + "/building/delete",
            "updateUrl": baseOprUrl + "/building/update"
        },
        "house": {
            "queryUrl": baseOprUrl + "/house/query"
        },
        "zoningInfo": {
            "queryUrl": baseOprUrl + "/seismicrecord/query",
            "deleteUrl": baseOprUrl + "/seismicrecord/delete"
        },
        "calculator": {
            "queryUrl": baseOprUrl + "/calculator/query",
            "staticUrl": baseOprUrl + "/calculator/statisticsBureau"
        },
        "word": {
            "creatUrl": baseOprUrl + "/word/create"
        },
        "user": {
            "addUrl": baseOprUrl + "/userdetails/add",
            "queryUrl": baseOprUrl + "/userdetails/query",
            "deleteUrl": baseOprUrl + "/userdetails/delete",
            "updateUrl": baseOprUrl + "/userdetails/update"
        },
        "bureau": {
            "addUrl": baseOprUrl + "/local/bureau/add",
            "queryUrl": baseOprUrl + "/local/bureau/query",
            "deleteUrl": baseOprUrl + "/local/bureau/delete",
            "updateUrl": baseOprUrl + "/local/bureau/update"
        }
    },
    "enumDatas": {
    }
};