﻿var hoverZoomPlugins = hoverZoomPlugins || [];
hoverZoomPlugins.push({
    name:'twitch',
    version:'2.0',
    prepareImgLinks:function (callback) {

        var res = [];
        var name = this.name;

        hoverZoom.urlReplace(res,
            'img[src*="profile_image"]',
            /-\d+x\d+/,
            '-600x600'
        );

        hoverZoom.urlReplace(res,
            'img[src]:not([src*="profile_image"]):not([src*="clips"]):not([src*="vods"]):not([src*="previews-ttv"])',
            /(-\d+x\d+)\./,
            '.'
        );

        hoverZoom.urlReplace(res,
            'img[src]:not([src*="profile_image"]):not([src*="clips"]):not([src*="vods"]):not([src*="previews-ttv"])',
            ['320x180','188x20'],
            ['2048x1152','1540x2048']
        );

        function getCookie(cname) {
            let name = cname + "=";
            var ca = document.cookie.split(';');
            for(let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0)==' ') c = c.substring(1);
                if (c.indexOf(name) == 0)
                    return c.substring(name.length,c.length);
            }
            return "";
        }

        // parse response to build fullsize url
        // sample : [{"data":{"clip":{"id":"1372471806","playbackAccessToken":{"signature":"8f4154426b574492d034a6907953d5697ed0d0eb","value":"{\"authorization\":{\"forbidden\":false,\"reason\":\"\"},\"clip_uri\":\"https://production.assets.clips.twitchcdn.net/AT-cm%7CTdUel9TB5UNcq-SuZe5E5g.mp4\",\"device_id\":\"XXKhfADJXmXEgJbc0cFGCLVmwpfhYQpl\",\"expires\":1636026481,\"user_id\":\"\",\"version\":2}","__typename":"PlaybackAccessToken"},"videoQualities":[{"frameRate":60,"quality":"1080","sourceURL":"https://production.assets.clips.twitchcdn.net/AT-cm%7CTdUel9TB5UNcq-SuZe5E5g.mp4","__typename":"ClipVideoQuality"},{"frameRate":60,"quality":"720","sourceURL":"https://production.assets.clips.twitchcdn.net/AT-cm%7CTdUel9TB5UNcq-SuZe5E5g-720.mp4","__typename":"ClipVideoQuality"},{"frameRate":30,"quality":"480","sourceURL":"https://production.assets.clips.twitchcdn.net/AT-cm%7CTdUel9TB5UNcq-SuZe5E5g-480.mp4","__typename":"ClipVideoQuality"},{"frameRate":30,"quality":"360","sourceURL":"https://production.assets.clips.twitchcdn.net/AT-cm%7CTdUel9TB5UNcq-SuZe5E5g-360.mp4","__typename":"ClipVideoQuality"}],"__typename":"Clip"}},"extensions":{"durationMilliseconds":113,"operationName":"VideoAccessToken_Clip","requestID":"01FKK7RPNSSK7QR99E98E0F8GV"}}]'
        function buildFullsizeUrl(link, response) {

            try {
                let r = JSON.parse(response);
                let signature = r.data.clip.playbackAccessToken.signature;
                let token = r.data.clip.playbackAccessToken.value;
                let t = JSON.parse(token);
                let clip_uri = t.clip_uri;
                let fullsizeUrl = clip_uri + '?sig=' + signature + '&token=' + encodeURIComponent(token);

                fullsizeUrl += '.video';

                if (link.data().hoverZoomSrc == undefined) { link.data().hoverZoomSrc = [] }
                if (link.data().hoverZoomSrc.indexOf(fullsizeUrl) == -1) {
                    link.data().hoverZoomSrc.unshift(fullsizeUrl);
                }
                callback(link, name);
                hoverZoom.displayPicFromElement(link);
            } catch {}
        }

        // ---------------------------------------------------- params
        var ClientID = "kimne78kx3ncx6brgo4mv6wki5h1ko";
        var XDeviceID = getCookie('unique_id') || getCookie('unique_id_durable') || localStorage.local_copy_unique_id;
        // operation names
        var operationNameClip = "VideoAccessToken_Clip";
        var operationNameLiveOrVOD = "PlaybackAccessToken";
        // hashes for persisted queries
        var sha256HashClip = "36b89d2507fce29e5ca551df756d27c1cfe079e2609642b4390aa4c35796eb11";
        var sha256HashLiveOrVOD = "0828119ded1c13477966434e15800ff57ddacf13ba1911c129dc2200705b0712";

        // ---------------------------------------------------- clips
        // sample: https://www.twitch.tv/potion_kr/clip/OpenPopularKimchiThunBeast-1MHlQ1yr5K5l7kTm
        // sample: https://www.twitch.tv/potion_kr/clip/OpenPopularKimchiThunBeast-1MHlQ1yr5K5l7kTm?filter=clips&range=30d&sort=time
        // sample: https://clips.twitch.tv/ConsiderateCuteGrouseOneHand-JKJrY3qglQ37kdsY?tt_medium=clips&tt_content=recommendation
        $('a[href]:not(.hoverZoomMouseover)').filter(function() { return (/\/clip\//.test(this.href)) || (/clips.twitch.tv\//.test(this.href)) }).addClass('hoverZoomMouseover').one('mouseover', function() {

            var link = this;
            link = $(link);

            var re = /(\/clip\/|clips.twitch.tv\/)([^?]{1,})/;
            var m = this.href.match(re);
            if (m == undefined) return;
            var slug = m[2];

            // build GraphQL query
            $.ajax({
                type: "POST",
                dataType: "text",
                url: "https://gql.twitch.tv/gql",
                headers: {"Client-ID":ClientID,"X-Device-Id":XDeviceID},
                data: "{\"operationName\":\"" + operationNameClip + "\",\"variables\":{\"slug\":\"" + slug + "\"},\"extensions\":{\"persistedQuery\":{\"version\":1,\"sha256Hash\":\"" + sha256HashClip + "\"}}}",
                success: function(response) {
                    buildFullsizeUrl(link, response);
                },
                error: function(response) {
                }
            });
        });

        // ---------------------------------------------------- live
        // sample: https://www.twitch.tv/beyondthesummit2
        $('a[href]:not(.hoverZoomMouseover2)').filter(function() { return (/^\/[^/]{1,}$/.test($(this).attr('href'))) }).addClass('hoverZoomMouseover2').one('mouseover', function() {

            var link = this;
            link = $(link);

            var login = link.attr('href').replace('/', '');

            // build GraphQL query
            performGraphQLLive(login, link);
        });

        function performGraphQLLive(login, link) {
            $.ajax({
                type: "POST",
                dataType: "text",
                url: "https://gql.twitch.tv/gql",
                headers: {"Client-ID":ClientID,"X-Device-Id":XDeviceID},
                data: "{\"operationName\":\"" + operationNameLiveOrVOD + "\",\"variables\":{\"isLive\":true,\"login\":\"" + login + "\",\"isVod\":false,\"vodID\":\"\",\"playerType\":\"site\"},\"extensions\":{\"persistedQuery\":{\"version\":1,\"sha256Hash\":\"" + sha256HashLiveOrVOD + "\"}}}",
                success: function(response) {
                    getPlaylistUrlLive(link, response);
                },
                error: function(response) {
                }
            });
        }

        //extract token, channel & signature from response and use them to build playlist url
        function getPlaylistUrlLive(link, response) {
            try {
                let token = JSON.parse(response).data.streamPlaybackAccessToken.value;
                let channel = JSON.parse(token).channel;
                let signature = JSON.parse(response).data.streamPlaybackAccessToken.signature;
                let urlPlaylist = "https://usher.ttvnw.net/api/channel/hls/" + channel + ".m3u8?sig=" + signature + "&token=" + token;

                let data = link.data();
                data.hoverZoomSrc = [urlPlaylist];

                callback(link, name);
                hoverZoom.displayPicFromElement(link);

                // get M3U8 file
                /*$.ajax({
                    type: "GET",
                    dataType: "text",
                    url: urlPlaylist
                });*/
            } catch { return; }
        }

        // ---------------------------------------------------- videos
        // sample: https://www.twitch.tv/videos/1178403330?filter=archives&sort=time
        //$('a[href*="/videos/"]:not(.hoverZoomMouseover3)').addClass('hoverZoomMouseover3').one('mouseover', function() {
        $('a[href*="/videos/"]').one('mouseover', function() {

            var link = this;
            link = $(link);

            var re = /\/videos\/(\d+)/;
            var m = link.attr('href').match(re);
            if (m == null) return;
            var vodID = m[1];

            // build GraphQL query
            performGraphQLVOD(vodID, link);
        });

        function performGraphQLVOD(vodID, link) {
            $.ajax({
                type: "POST",
                dataType: "text",
                url: "https://gql.twitch.tv/gql",
                headers: {"Client-ID":ClientID,"X-Device-Id":XDeviceID},
                data: "{\"operationName\":\"" + operationNameLiveOrVOD + "\",\"variables\":{\"isLive\":false,\"login\":\"\",\"isVod\":true,\"vodID\":\"" + vodID + "\",\"playerType\":\"site\"},\"extensions\":{\"persistedQuery\":{\"version\":1,\"sha256Hash\":\"" + sha256HashLiveOrVOD + "\"}}}",
                success: function(response) {
                    getPlaylistUrlVOD(link, response);
                },
                error: function(response) {
                }
            });
        }

        //extract token, channel & signature from response and use them to build playlist url
        function getPlaylistUrlVOD(link, response) {
            try {
                let token = JSON.parse(response).data.videoPlaybackAccessToken.value;
                let vod_id = JSON.parse(token).vod_id;
                let signature = JSON.parse(response).data.videoPlaybackAccessToken.signature;
                let urlPlaylist = "https://usher.ttvnw.net/vod/" + vod_id + ".m3u8?sig=" + signature + "&token=" + token;

                let data = link.data();
                data.hoverZoomSrc = [urlPlaylist];

                callback(link, name);
                hoverZoom.displayPicFromElement(link);

                // get M3U8 file
                /*$.ajax({
                    type: "GET",
                    dataType: "text",
                    url: urlPlaylist
                });*/
            } catch { return; }
        }

        callback($(res), this.name);
    }
});