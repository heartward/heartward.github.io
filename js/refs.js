// Catechism references in any text ("Catechism 2759-2765", "کاتکیسم ۲۰۰ تا ۲۰۲") become links to the
// official English text on the Vatican website. That site splits the Catechism into one page per section,
// so this table gives the first paragraph on each page (from the Vatican's own index).
import { t, toast } from './ui.js';

const PAGES = '1:2 4:3 11:4 13:5 18:6 23:7 26:8 27:9 31:A 36:B 39:C 44:D 50:E 51:F 54:G 65:H 68:I 74:J 75:K 80:L 84:M 96:N 101:O 105:P 109:Q 120:R 131:S 134:T 142:U 144:V 150:W 153:X 166:Y 168:Z 170:10 172:11 176:12 185:14 198:15 199:16 232:17 268:18 279:19 325:1A 355:1B 385:1C 422:1D 430:1E 436:1F 441:1G 446:1H 452:1I 456:1J 484:1K 512:1L 571:1M 574:1N 595:1O 624:1P 631:1Q 632:1R 638:1S 659:1T 665:1U 668:1V 678:1W 680:1X 683:1Y 687:1Z 689:20 691:21 702:22 717:23 731:24 742:25 748:26 751:27 781:28 811:29 871:2A 946:2B 963:2C 976:2D 977:2E 981:2F 988:2G 992:2H 1005:2I 1015:2J 1020:2K 1021:2L 1023:2M 1030:2N 1033:2O 1038:2P 1042:2Q 1051:2R 1061:2S 1066:2T 1076:2U 1077:2V 1084:2W 1091:2X 1110:2Y 1113:2Z 1114:30 1117:31 1122:32 1127:33 1130:34 1131:35 1135:36 1136:37 1145:38 1163:39 1179:3A 1187:3B 1200:3C 1207:3D 1210:3E 1212:3F 1213:3G 1214:3H 1217:3I 1229:3J 1246:3K 1256:3L 1257:3M 1262:3N 1275:3O 1285:3P 1286:3Q 1293:3R 1302:3S 1306:3T 1312:3U 1315:3V 1322:3W 1324:3X 1328:3Y 1333:3Z 1345:40 1356:41 1382:42 1402:43 1406:44 1420:45 1422:46 1423:47 1425:48 1427:49 1430:4A 1434:4B 1440:4C 1450:4D 1461:4E 1468:4F 1471:4G 1480:4H 1485:4I 1499:4J 1500:4K 1514:4L 1517:4M 1520:4N 1524:4O 1526:4P 1533:4Q 1536:4R 1537:4S 1539:4T 1554:4U 1572:4V 1575:4W 1577:4X 1581:4Y 1590:4Z 1601:50 1602:51 1621:52 1625:53 1638:54 1643:55 1655:56 1659:57 1667:58 1677:59 1680:5A 1681:5B 1684:5C 1691:5D 1699:5E 1700:5F 1701:5G 1710:5H 1716:5I 1718:5J 1720:5K 1725:5L 1730:5M 1731:5N 1739:5O 1743:5P 1749:5Q 1750:5R 1755:5S 1757:5T 1762:5U 1763:5V 1767:5W 1771:5X 1776:5Y 1777:5Z 1783:60 1786:61 1790:62 1795:63 1803:64 1804:65 1812:66 1830:67 1833:68 1846:69 1849:6A 1852:6B 1854:6C 1865:6D 1870:6E 1877:6F 1878:6G 1886:6H 1890:6I 1897:6J 1905:6K 1913:6L 1918:6M 1928:6N 1929:6O 1934:6P 1939:6Q 1943:6R 1949:6S 1950:6T 1954:6U 1961:6V 1965:6W 1975:6X 1987:6Y 1996:6Z 2006:70 2012:71 2017:72 2030:73 2032:74 2041:75 2044:76 2047:77 2052:78 2075:79 2083:7A 2084:7C 2095:7D 2110:7E 2129:7F 2133:7G 2142:7I 2150:7J 2156:7K 2160:7L 2168:7N 2174:7O 2189:7P 2196:7Q 2197:7R 2201:7S 2207:7T 2214:7U 2232:7V 2234:7W 2247:7X 2258:7Y 2259:7Z 2284:80 2302:81 2318:82 2331:84 2337:85 2360:86 2380:87 2392:88 2401:89 2402:8A 2407:8B 2419:8C 2426:8D 2437:8E 2443:8F 2450:8G 2464:8H 2465:8I 2471:8J 2475:8K 2488:8L 2493:8M 2500:8N 2504:8O 2514:8P 2517:8Q 2520:8R 2528:8S 2534:8T 2535:8U 2541:8V 2544:8W 2548:8X 2551:8Y 2558:8Z 2566:90 2568:91 2590:92 2598:93 2620:94 2623:95 2626:96 2629:97 2634:98 2637:99 2639:9A 2644:9B 2650:9C 2652:9D 2661:9E 2663:9F 2680:9G 2683:9H 2692:9I 2697:9J 2700:9K 2705:9L 2709:9M 2720:9N 2725:9O 2726:9P 2729:9Q 2734:9R 2742:9S 2746:9T 2752:9U 2759:9V 2761:9W 2762:9X 2765:9Y 2767:9Z 2773:A0 2777:A1 2779:A2 2786:A3 2794:A4 2797:A5 2803:A6 2807:A7 2816:A8 2822:A9 2828:AA 2838:AB 2846:AC 2855:AD 2857:AE'
  .split(' ').map(p => { const [n, c] = p.split(':'); return [+n, c]; });
const BASE = 'https://www.vatican.va/archive/ENG0015/';

export function cccUrl(n) {
  if (!(n >= 1 && n <= 2865)) return BASE + '_INDEX.HTM';
  let page = PAGES[0][1];
  for (const [start, code] of PAGES) { if (start > n) break; page = code; }
  // The text fragment scrolls straight to the paragraph number in browsers that support it.
  return BASE + '__P' + page + '.HTM#:~:text=' + n;
}

const D = '[0-9۰-۹]';
const NUM = D + '{1,4}(?!' + D + ')';
const RANGE = NUM + '(?:\\s*(?:-|–|تا)\\s*' + NUM + ')?(?!' + D + '|:' + D + ')';
const SEP = '(?:\\s*[,،]\\s*(?:and\\s+|و\\s+)?|\\s+(?:and|و)\\s+)';
const LEAD = '(?:Catechism|کاتکیسم)(?: of the Catholic Church| کلیسای کاتولیک)?(?:,? paragraphs?|،? بندهای|،? بند)?\\s*(?:§\\s*)?';
const FULL = new RegExp(LEAD + RANGE + '(?:' + SEP + RANGE + ')*', 'g');
const RANGES = new RegExp(RANGE, 'g');
const toAscii = s => s.replace(/[۰-۹]/g, d => d.charCodeAt(0) - 0x06F0);

function link(text, n) {
  const a = document.createElement('a');
  a.className = 'ccc-link'; a.href = cccUrl(n); a.target = '_blank'; a.rel = 'noopener';
  a.title = t('Read in the Catechism (Vatican website)');
  a.textContent = text;
  return a;
}

// Wrap each reference found in the text under root. Text already inside a link or a form control is left alone.
export function linkCatechism(root) {
  if (!root) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: n => /Catechism|کاتکیسم/.test(n.nodeValue) && !n.parentNode.closest('a,button,label,summary,script,style,textarea,input,select,title')
      ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
  });
  const nodes = []; for (let n; (n = w.nextNode());) nodes.push(n);
  nodes.forEach(node => {
    const v = node.nodeValue; let last = 0, any = false;
    const frag = document.createDocumentFragment();
    v.replace(FULL, (m, off) => {
      any = true;
      frag.append(v.slice(last, off));
      // The words and the first number form one link; each further number or range is its own link.
      let first = true, pos = 0;
      m.replace(RANGES, (r, ro) => {
        const n = parseInt(toAscii(r), 10);
        if (first) { frag.append(link(m.slice(0, ro + r.length), n)); first = false; }
        else { frag.append(m.slice(pos, ro), link(r, n)); }
        pos = ro + r.length; return r;
      });
      frag.append(m.slice(pos));
      last = off + m.length; return m;
    });
    if (!any) return;
    frag.append(v.slice(last));
    node.replaceWith(frag);
  });
}

// The Catechism lives on the web. Offline, say so instead of opening a blank page.
document.addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('a.ccc-link');
  if (a && navigator.onLine === false) { e.preventDefault(); toast(t('The Catechism opens when you are back online')); }
});
