import { MigrationInterface, QueryRunner } from "typeorm";
import * as argon2 from "argon2";
import { randomBytes } from "crypto";

// Source: "Mosques of Romania" Google My Maps
// (mid=1qrUwezTO_eKzaSpf6wYynA-MzGt1vYs), exported to KML and reverse-geocoded
// (Nominatim) for street addresses, which the map itself doesn't carry.
const IMPORT_USER_EMAIL = "data-import@muslimspaces.ro";

interface MosqueSeed {
  name: string;
  lat: number;
  lng: number;
  address: string;
  year: string | null;
  statusEn: string;
  statusRo: string;
  prayers: string | null;
}

const MOSQUES: MosqueSeed[] = [
  {"name": "Brebeni Mosque", "lat": 44.0867537, "lng": 27.7865666, "address": "Strada Principală, Rariștea, Constanța, România", "year": "1871", "statusEn": "abandoned", "statusRo": "abandonată", "prayers": null},
  {"name": "Călărași Mosque", "lat": 44.1984139, "lng": 27.3479855, "address": "Prelungirea Ion Luca Caragiale, Călărași, România", "year": "2014", "statusEn": "functional", "statusRo": "funcțională", "prayers": "5 daily, Jumu'ah, Tarawih, Eid"},
  {"name": "Carol Hunchiar Mosque", "lat": 44.404738, "lng": 26.0952043, "address": "Strada Constantin Mănescu 4, București, România", "year": "1960", "statusEn": "functional", "statusRo": "funcțională", "prayers": "5 daily, Jumu'ah, Tarawih, Eid"},
  {"name": "Cuiugiuc Mosque", "lat": 44.046072, "lng": 27.5257003, "address": "Cuiugiuc, Constanța, România", "year": null, "statusEn": "abandoned", "statusRo": "abandonată", "prayers": null},
  {"name": "Carvăn Mosque", "lat": 44.0373125, "lng": 27.5652841, "address": "Carvăn, Constanța, România", "year": "1990", "statusEn": "abandoned", "statusRo": "abandonată", "prayers": null},
  {"name": "Tudor Vladimirescu Mosque", "lat": 43.9990123, "lng": 27.7015977, "address": "Strada Principală, Tudor Vladimirescu, Constanța, România", "year": "1800", "statusEn": "abandoned", "statusRo": "abandonată", "prayers": null},
  {"name": "Giuma Mosque", "lat": 43.9666491, "lng": 28.2660447, "address": "Casicea, Constanța, România", "year": "1850", "statusEn": "abandoned", "statusRo": "abandonată", "prayers": null},
  {"name": "Ciobănița Mosque", "lat": 44.0131541, "lng": 28.2825894, "address": "Ciobănița, Constanța, România", "year": "1898", "statusEn": "abandoned", "statusRo": "abandonată", "prayers": null},
  {"name": "Castelu Old Mosque", "lat": 44.2615691, "lng": 28.342655, "address": "Strada Atatürk, Castelu, Constanța, România", "year": "1870", "statusEn": "abandoned", "statusRo": "abandonată", "prayers": null},
  {"name": "Mihail Kogălniceanu Old Mosque", "lat": 44.3621108, "lng": 28.4581035, "address": "Strada Daciei, Mihail Kogălniceanu, Constanța, România", "year": "1880", "statusEn": "abandoned", "statusRo": "abandonată", "prayers": null},
  {"name": "Cotu Văii Mosque", "lat": 43.8240651, "lng": 28.3518884, "address": "Strada Ion Roată, Cotu Văii, Constanța, România", "year": "1880", "statusEn": "abandoned", "statusRo": "abandonată", "prayers": null},
  {"name": "Sarighiol Mosque", "lat": 43.7995192, "lng": 28.4389908, "address": "Strada Ion Mecu, Albești, Constanța, România", "year": "1865", "statusEn": "abandoned", "statusRo": "abandonată", "prayers": null},
  {"name": "Colina Mosque", "lat": 45.0247753, "lng": 29.0323303, "address": "Strada Lalelelor, Colina, Tulcea, România", "year": "1861", "statusEn": "abandoned", "statusRo": "abandonată", "prayers": null},
  {"name": "Murighiol Mosque", "lat": 45.0351197, "lng": 29.1610985, "address": "Murighiol, Tulcea, România", "year": "1849", "statusEn": "abandoned", "statusRo": "abandonată", "prayers": null},
  {"name": "Abrud Mosque", "lat": 44.1470379, "lng": 27.9794318, "address": "Strada Lăcrămioarei, Abrud, Constanța, România", "year": "1914", "statusEn": "abandoned", "statusRo": "abandonată", "prayers": null},
  {"name": "Biruința Mosque", "lat": 43.9963876, "lng": 28.5113219, "address": "Biruința, Constanța, România", "year": "1860", "statusEn": "abandoned", "statusRo": "abandonată", "prayers": null},
  {"name": "Poiana Mosque", "lat": 44.2217575, "lng": 28.4987213, "address": "Strada Albatros, Poiana, Constanța, România", "year": null, "statusEn": "abandoned", "statusRo": "abandonată", "prayers": null},
  {"name": "Lespezi Old Mosque", "lat": 44.0183656, "lng": 27.8288613, "address": "Strada Cantabine, Lespezi, Constanța, România", "year": null, "statusEn": "abandoned", "statusRo": "abandonată", "prayers": null},
  {"name": "Ciucurova Mosque", "lat": 44.9167251, "lng": 28.4788669, "address": "Strada Principală, Ciucurova, Tulcea, România", "year": "1922", "statusEn": "functional", "statusRo": "funcțională", "prayers": "5 daily, Jumu'ah, Tarawih, Eid"},
  {"name": "Ali Gazi Pașa Mosque", "lat": 44.8926083, "lng": 28.7208457, "address": "Strada Geamiei 2, Babadag, Tulcea, România", "year": "1610", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Mahmudia Mosque", "lat": 45.0830179, "lng": 29.0910742, "address": "Strada Unirii 1, Mahmudia, Tulcea, România", "year": "1832", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Eid"},
  {"name": "Aziziye‎ Mosque", "lat": 45.1815287, "lng": 28.8066438, "address": "Strada Independenței 2, Tudor Vladimirescu, Tulcea, România", "year": "1865", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Mahmud Yazîcî Mosque", "lat": 45.2748176, "lng": 28.4579734, "address": "Strada Vidin, Isaccea, Tulcea, România", "year": "1864", "statusEn": "functional", "statusRo": "funcțională", "prayers": "5 daily, Jumu'ah, Tarawih, Eid"},
  {"name": "Mestan Aga Mosque", "lat": 45.2449171, "lng": 28.1294186, "address": "Strada Granitului 5, Măcin, Tulcea, România", "year": "1860", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Piatra Mosque", "lat": 44.4077244, "lng": 28.5603201, "address": "Strada Frunzelor, Piatra, Constanța, România", "year": "1871", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Eid"},
  {"name": "Mamutcuius Mosque", "lat": 44.15296, "lng": 28.1622532, "address": "Strada Fântânii, Izvoru Mare, Constanța, România", "year": "1866", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Eid"},
  {"name": "Mahmut Sultan Mosque", "lat": 44.6830161, "lng": 27.9483985, "address": "Strada Vadului, Hârșova, Constanța, România", "year": "1812", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Gherghina Mosque", "lat": 44.32104, "lng": 28.1807869, "address": "Strada Principală, Țibrinu, Constanța, România", "year": "1874", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Eid"},
  {"name": "Nicoale Bălcescu Mosque", "lat": 44.3904888, "lng": 28.3770519, "address": "Strada Geamiei 18, Nicolae Bălcescu, Constanța, România", "year": "1922", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Eid"},
  {"name": "Siliștea Mosque", "lat": 44.400377, "lng": 28.1815742, "address": "Strada Crizantemelor, Siliștea, Constanța, România", "year": "1850", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Grădina Mosque", "lat": 44.554782, "lng": 28.4316723, "address": "Grădina, Constanța, România", "year": "1860", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Cernavodă Mosque", "lat": 44.3389135, "lng": 28.0321019, "address": "Dacia (in constr), Cernavodă, Constanța, România", "year": "1756", "statusEn": "functional", "statusRo": "funcțională", "prayers": "5 daily, Jumu'ah, Tarawih, Eid"},
  {"name": "Mihail Kogălniceanu New Mosque", "lat": 44.3621379, "lng": 28.4593273, "address": "Strada Grădinilor, Mihail Kogălniceanu, Constanța, România", "year": "2011", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Suleyman Hagi Mosque", "lat": 44.2610201, "lng": 28.3399509, "address": "Strada Baba Novac, Castelu, Constanța, România", "year": "2013", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Nisipari Mosque", "lat": 44.2559739, "lng": 28.3974884, "address": "Strada Constantin Brătescu, Nisipari, Constanța, România", "year": "1858", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Eid"},
  {"name": "Năvodari Mosque", "lat": 44.3234138, "lng": 28.6120666, "address": "Strada Constanței, Năvodari, Constanța, România", "year": "2006", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Lumina Mosque", "lat": 44.2958237, "lng": 28.5651285, "address": "Strada Bradului, Lumina, Constanța, România", "year": "1903", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Ovidiu Mosque", "lat": 44.2506911, "lng": 28.5669771, "address": "Strada Națională, Ovidiu, Constanța, România", "year": "1884", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Jumu'ah, Tarawih, Eid"},
  {"name": "Poarta Albă Mosque", "lat": 44.2088713, "lng": 28.3977877, "address": "Strada Primăriei, Poarta Albă, Constanța, România", "year": "1877", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Murfatlar Mosque", "lat": 44.1720894, "lng": 28.4111917, "address": "Strada Credinței, Murfatlar, Constanța, România", "year": "1981", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Valea Seacă Mosque", "lat": 44.1641998, "lng": 28.4428062, "address": "Strada Geamiei, Valu lui Traian, Constanța, România", "year": "1911", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Jumu'ah, Tarawih, Eid"},
  {"name": "Valu Lui Traian Veche Mosque", "lat": 44.1623026, "lng": 28.4795897, "address": "Strada Luncii, Valu lui Traian, Constanța, România", "year": "1880", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Jumu'ah, Tarawih, Eid"},
  {"name": "Valu Lui Traian Nouă Mosque", "lat": 44.1657302, "lng": 28.4820426, "address": "Strada Crimeea, Valu lui Traian, Constanța, România", "year": "2004", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Jumu'ah, Tarawih, Eid"},
  {"name": "Azizie Mosque", "lat": 44.2324073, "lng": 28.5962432, "address": "Strada Santinelei 21, Palazu Mare, Constanța, România", "year": "1858", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Tomis Nord Mosque", "lat": 44.2074716, "lng": 28.6262075, "address": "Strada Suceava, Constanța, România", "year": "2008", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Jumu'ah, Tarawih, Eid"},
  {"name": "Anadalchioi Mosque", "lat": 44.1934568, "lng": 28.6349331, "address": "Strada Farului, Constanța, România", "year": "1869", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Jumu'ah, Tarawih, Eid"},
  {"name": "Coiciu Mosque", "lat": 44.1843344, "lng": 28.6332789, "address": "Strada Poporului, Constanța, România", "year": "1958", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr, Jumu'ah, Tarawih, Eid"},
  {"name": "Kumluk Mosque", "lat": 44.1943207, "lng": 28.6455309, "address": "Strada Timișanei, Constanța, România", "year": "2001", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Jumu'ah, Tarawih, Eid"},
  {"name": "Hunchiar Mosque", "lat": 44.1756797, "lng": 28.6550163, "address": "Strada Doinei, Constanța, România", "year": "1869", "statusEn": "under renovation", "statusRo": "în renovare", "prayers": null},
  {"name": "Carol Mosque", "lat": 44.1733179, "lng": 28.6597326, "address": "Strada Adrian Rădulescu 1, Constanța, România", "year": "1913", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Jumu'ah, Tarawih, Eid"},
  {"name": "Abdul Megid Mosque", "lat": 44.2455578, "lng": 28.2707106, "address": "Strada Decebal 10, Medgidia, Constanța, România", "year": "1865", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr, Jumu'ah, Tarawih, Eid"},
  {"name": "Abdurrahman Efendi Mosque", "lat": 44.2429657, "lng": 28.2735105, "address": "Strada Mărgăritarului 31A, Medgidia, Constanța, România", "year": "2018", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Zakat Mosque", "lat": 44.238039, "lng": 28.2861704, "address": "Medgidia, Constanța, România", "year": "2025", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr, Jumu'ah, Tarawih, Eid"},
  {"name": "Valea Dacilor Mosque", "lat": 44.1973189, "lng": 28.3145393, "address": "Strada Drumului Județean, Valea Dacilor, Constanța, România", "year": "1858", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr, Jumu'ah, Tarawih, Eid"},
  {"name": "Cumpăna Mosque", "lat": 44.1131784, "lng": 28.5636435, "address": "Strada Monumentului, Cumpăna, Constanța, România", "year": "1930", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Lazu Mosque", "lat": 44.1148413, "lng": 28.6078541, "address": "Strada Axente Sever Ioan, Lazu, Constanța, România", "year": "1860", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Agigea Mosque", "lat": 44.0914883, "lng": 28.6130661, "address": "Strada Corneliu Leu, Agigea, Constanța, România", "year": "1878", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Techirghiol Mosque", "lat": 44.0543173, "lng": 28.5918654, "address": "Strada Nicolae Bălcescu, Techirghiol, Constanța, România", "year": "1936", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Eforie Nord Mosque", "lat": 44.0627928, "lng": 28.6327281, "address": "Strada Transilvaniei, Eforie Nord, Constanța, România", "year": "2000", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Eforie Sud Mosque", "lat": 44.0214017, "lng": 28.6466895, "address": "Strada Milcov, Eforie Sud, Constanța, România", "year": "2005", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Tuzla Mosque", "lat": 44.0084179, "lng": 28.6406962, "address": "Strada Zefirului, Tuzla, Constanța, România", "year": "1870", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "23 August Mosque", "lat": 43.9143266, "lng": 28.5838364, "address": "Strada George Bacovia, 23 August, Constanța, România", "year": "2010", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Esmahan Sultan Mosque", "lat": 43.8102119, "lng": 28.5829477, "address": "Strada Oituz 1, Saturn, Constanța, România", "year": "1575", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr, Jumu'ah, Tarawih, Eid"},
  {"name": "2 Mai Mosque", "lat": 43.7827585, "lng": 28.5738354, "address": "Strada 24 Ianuarie, 2 Mai, Constanța, România", "year": "2006", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Hagieni Mosque", "lat": 43.7846015, "lng": 28.4771534, "address": "Strada Bujorilor, Hagieni, Constanța, România", "year": "1903", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Eid"},
  {"name": "Dulcești Mosque", "lat": 43.9078149, "lng": 28.5468216, "address": "Strada Nicolae Filimon 5, Dulcești, Constanța, România", "year": "1891", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Albești Mosque", "lat": 43.8006181, "lng": 28.4234078, "address": "Strada Cișmelei, Albești, Constanța, România", "year": "1859", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Eid"},
  {"name": "Moșneni Mosque", "lat": 43.9345825, "lng": 28.5296254, "address": "Strada Gheorghe Duca, Moșneni, Constanța, România", "year": "1856", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Eid"},
  {"name": "Pecineaga Mosque", "lat": 43.8963986, "lng": 28.4970586, "address": "Strada Morii, Pecineaga, Constanța, România", "year": "1873", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Eid"},
  {"name": "Negru Vodă Mosque", "lat": 43.8190336, "lng": 28.2127081, "address": "Strada Recoltei, Negru Vodă, Constanța, România", "year": "1867", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Tătaru Mosque", "lat": 43.8803877, "lng": 28.3569957, "address": "Intrarea Azaplar, Tătaru, Constanța, România", "year": "1880", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Eid"},
  {"name": "Amzacea Small Mosque", "lat": 43.9616453, "lng": 28.3898038, "address": "Strada Merișori, Amzacea, Constanța, România", "year": "1890", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Tarawih"},
  {"name": "Giuma Mosque", "lat": 43.9571019, "lng": 28.3936927, "address": "Strada Geamiei, Amzacea, Constanța, România", "year": "1850", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Movilița Mosque", "lat": 44.0449938, "lng": 28.5060833, "address": "Movilița, Constanța, România", "year": "1870", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Topraisar Mosque", "lat": 44.0106058, "lng": 28.4539766, "address": "Strada Piersicului, Topraisar, Constanța, România", "year": "1910", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Bărăganu Mosque", "lat": 44.0885716, "lng": 28.4160821, "address": "DC20, Bărăganu, Constanța, România", "year": "1922", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Eid"},
  {"name": "Mereni Mosque", "lat": 44.0263127, "lng": 28.3879955, "address": "Mereni, Constanța, România", "year": "1924", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Osmancea Mosque", "lat": 44.0124829, "lng": 28.3233209, "address": "DJ391, Osmancea, Constanța, România", "year": "1884", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Cobadin Mosque", "lat": 44.0634399, "lng": 28.2328157, "address": "Strada Izvor, Cobadin, Constanța, România", "year": "1934", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Jumu'ah, Tarawih, Eid"},
  {"name": "Viișoara  Mosque", "lat": 44.0738528, "lng": 28.1988428, "address": "Strada Zorelelor, Viișoara, Constanța, România", "year": "1862", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Eid"},
  {"name": "Ciocârlia De Jos Mosque", "lat": 44.104886, "lng": 28.2851671, "address": "Strada Geamiei, Ciocârlia, Constanța, România", "year": "1867", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Ciocârlia De Sus Mosque", "lat": 44.1170246, "lng": 28.3336728, "address": "Strada Gloriei 13A, Ciocârlia de Sus, Constanța, România", "year": "1880", "statusEn": "functional", "statusRo": "funcțională", "prayers": null},
  {"name": "Făurei Mosque", "lat": 44.0394162, "lng": 27.6943335, "address": "Strada Bradului, Făurei, Constanța, România", "year": "1854", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Fântâna Mare Mosque", "lat": 43.9790468, "lng": 28.0566687, "address": "Strada Principală, Fântâna Mare, Constanța, România", "year": "1860", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr, Jumu'ah, Tarawih, Eid"},
  {"name": "Independenţa Mosque", "lat": 43.952799, "lng": 28.078166, "address": "Independența, Constanța, România", "year": "1870", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr, Jumu'ah, Tarawih, Eid"},
  {"name": "Lespezi New Mosque", "lat": 44.0198441, "lng": 27.829849, "address": "Strada Giurgiului, Lespezi, Constanța, România", "year": "2014", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Aydeniz Mosque", "lat": 44.0189408, "lng": 27.8751459, "address": "Văleni, Constanța, România", "year": "2014", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Dobromir Mosque", "lat": 44.0209805, "lng": 27.7844067, "address": "Strada Băneasa, Dobromir, Constanța, România", "year": "1858", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr, Jumu'ah, Tarawih, Eid"},
  {"name": "Taiba Mosque", "lat": 44.2073176, "lng": 28.645377, "address": "Strada Maior Șofran 11, Constanța, România", "year": "1995", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr, Jumu'ah, Tarawih, Eid"},
  {"name": "Asociația Musulmanilor Din România Mosque", "lat": 44.1723523, "lng": 28.6310554, "address": "Bulevardul I. C. Brătianu 14, Constanța, România", "year": "2020", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Fundația De Servicii Islamice din România Constanța Mosque", "lat": 44.1358211, "lng": 28.6185213, "address": "Strada Fântânele 4A, Constanța, România", "year": "2003", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr, Jumu'ah, Tarawih, Eid"},
  {"name": "Asociația Cultural Umanitară Dua Mosque", "lat": 44.1285521, "lng": 28.6047789, "address": "Agigea, Constanța, România", "year": "2024", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr, Jumu'ah, Tarawih, Eid"},
  {"name": "Jamia Mosque", "lat": 45.2830069, "lng": 27.9647345, "address": "Bulevardul Dorobanților, Brăila, România", "year": null, "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Iași Mosque", "lat": 47.1598617, "lng": 27.577095, "address": "Strada Morilor 20, Iași, România", "year": "1992", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr, Jumu'ah, Tarawih, Eid"},
  {"name": "Turkrom Mosque", "lat": 45.6724991, "lng": 27.1772566, "address": "Calea Munteniei, Focșani, Vrancea, România", "year": "1994", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Jumu'ah, Eid"},
  {"name": "Al Fajr Mosque", "lat": 46.5498847, "lng": 24.5566288, "address": "Strada Călărașilor 83, Târgu Mureș, Mureș, România", "year": null, "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Brașov Mosque", "lat": 45.6991199, "lng": 25.5856186, "address": "Strada Câmpul cu Flori, Brașov, România", "year": null, "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr, Jumu'ah, Tarawih, Eid"},
  {"name": "Ploiești Central Mosque", "lat": 44.9346804, "lng": 26.0469576, "address": "Strada Mircea cel Bătrân 81, Ploiești, Prahova, România", "year": null, "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr, Jumu'ah, Eid"},
  {"name": "Haji Muhammad Sher Mosque", "lat": 44.8756815, "lng": 24.848584, "address": "Strada Gavana, Pitești, Argeș, România", "year": null, "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr, Jumu'ah, Tarawih, Eid"},
  {"name": "Sibiu Al Iman Mosque", "lat": 45.7573936, "lng": 23.9700607, "address": "Strada Avram Iancu, Orlat, Sibiu, România", "year": null, "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr, Jumu'ah, Tarawih, Eid"},
  {"name": "Deva Mosque", "lat": 45.8807462, "lng": 22.9074538, "address": "Strada Ion Luca Caragiale 16, Deva, Hunedoara, România", "year": "2013", "statusEn": "abandoned", "statusRo": "abandonată", "prayers": null},
  {"name": "Islamic Cultural Center Of Craiova Mosque", "lat": 44.3185278, "lng": 23.8315465, "address": "Strada Grigore Pleșoianu 11L, Craiova, Dolj, România", "year": null, "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr, Jumu'ah, Tarawih, Eid"},
  {"name": "Cluj-Napoca Mosque", "lat": 46.7611597, "lng": 23.5780168, "address": "Strada Păstorului 17, Cluj-Napoca, Cluj, România", "year": null, "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr, Jumu'ah, Tarawih, Eid"},
  {"name": "Timișoara Central Mosque", "lat": 45.7344146, "lng": 21.2290437, "address": "Strada Doctor Ioan Mureșan 15, Timișoara, Timiș, România", "year": "1992", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr, Jumu'ah, Tarawih, Eid"},
  {"name": "Oradea Mosque", "lat": 47.0528232, "lng": 21.936767, "address": "Piața 1 Decembrie, Oradea, Bihor, România", "year": null, "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr, Jumu'ah, Tarawih, Eid"},
  {"name": "Al-Huda Mosque", "lat": 46.1863414, "lng": 21.3062101, "address": "Strada Haica-Sava 6, Arad, România", "year": null, "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr, Jumu'ah, Tarawih, Eid"},
  {"name": "Arad Mosque", "lat": 46.1959411, "lng": 21.3104071, "address": "Strada Poetului 1/C, Arad, România", "year": null, "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr, Jumu'ah, Tarawih, Eid"},
  {"name": "Islamic Culture Centre Mosque", "lat": 47.7962284, "lng": 22.8712747, "address": "Strada Rândunelelor 19, Satu Mare, România", "year": null, "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr, Jumu'ah, Tarawih, Eid"},
  {"name": "Cosmopolis Mosque", "lat": 44.530156, "lng": 26.1693066, "address": "Crețuleasca, Ilfov, România", "year": null, "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr, Jumu'ah, Tarawih, Eid"},
  {"name": "Ibadullah Mosque", "lat": 44.4975524, "lng": 26.2047214, "address": "Șoseaua Afumați, Voluntari, Ilfov, România", "year": "2008", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr, Jumu'ah, Tarawih, Eid"},
  {"name": "Fundeni Mosque", "lat": 44.445138, "lng": 26.165954, "address": "Șoseaua Fundeni 9, București, România", "year": null, "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr, Jumu'ah, Tarawih, Eid"},
  {"name": "Taiba Mosque", "lat": 44.4731929, "lng": 26.1536814, "address": "Șoseaua Colentina 373, București, România", "year": "1998", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr, Jumu'ah, Tarawih"},
  {"name": "Al-Quds Mosque", "lat": 44.4692862, "lng": 26.1407499, "address": "Strada Fabrica de Gheață 14, București, România", "year": null, "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr, Jumu'ah, Tarawih"},
  {"name": "Al-Taqwa Mosque", "lat": 44.4186957, "lng": 26.1167315, "address": "Strada Logofătul Tăutu 87, București, România", "year": null, "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr, Jumu'ah, Tarawih, Eid"},
  {"name": "Ayash Mosque", "lat": 44.4407002, "lng": 26.0594201, "address": "Bulevardul Doina Cornea 1D, București, România", "year": null, "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Al-Rahman Mosque", "lat": 44.44829, "lng": 26.0462484, "address": "Strada Munții Gurghiului 50-52, București, România", "year": "1994", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr, Jumu'ah, Tarawih, Eid"},
  {"name": "Oz Demir Mosque", "lat": 44.170696, "lng": 28.6335316, "address": "Strada Labirint 16-16A, Constanța, România", "year": "2012", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha"},
  {"name": "Konak Mosque", "lat": 44.1772639, "lng": 28.6239837, "address": "Strada Eliberării 4, Constanța, România", "year": "2016", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha"},
  {"name": "Dristor Apaca Mosque", "lat": 44.4342389, "lng": 26.0533738, "address": "Bulevardul Iuliu Maniu 7, București, România", "year": "2020", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr"},
  {"name": "Dristor Tineretului Mosque", "lat": 44.4170241, "lng": 26.1040155, "address": "Bulevardul Dimitrie Cantemir 22, București, România", "year": "2018", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr"},
  {"name": "Dristor Centrul Vechi Mosque", "lat": 44.4300411, "lng": 26.100351, "address": "Strada Șelari, București, România", "year": "2011", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr"},
  {"name": "Dristor Mosque", "lat": 44.420355, "lng": 26.1374388, "address": "Bulevardul Camil Ressu 1, București, România", "year": "1999", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr"},
  {"name": "Oțelu Roșu Mosque", "lat": 45.5101778, "lng": 22.3446299, "address": "Strada Revoluției, Oțelu Roșu, Caraș-Severin, România", "year": null, "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Dagestan Mosque", "lat": 45.7558812, "lng": 22.9042655, "address": "Bulevardul Ion Corvin 5, Hunedoara, România", "year": null, "statusEn": "functional", "statusRo": "funcțională", "prayers": "Jumu'ah, Tarawih, Eid"},
  {"name": "Fundația De Servicii Islamice Din România Călărași Mosque", "lat": 44.1977778, "lng": 27.3472017, "address": "Prelungirea Ion Luca Caragiale, Călărași, România", "year": "2025", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr, Jumu'ah, Tarawih, Eid"},
  {"name": "Koksal Mosque", "lat": 44.417617, "lng": 26.1292993, "address": "Strada Breaza, București, România", "year": "1996", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr"},
  {"name": "Fatih Mosque", "lat": 46.7668292, "lng": 23.599314, "address": "Strada Fluierașului 4, Cluj-Napoca, Cluj, România", "year": "2026", "statusEn": "functional", "statusRo": "funcțională", "prayers": "Dhuhr, Asr, Maghrib, Isha, Fajr, Tarawih"},
];

function buildDescription(m: MosqueSeed): { ro: string; en: string } {
  const yearEn = m.year ?? "unknown";
  const yearRo = m.year ?? "necunoscut";
  const prayersEn = m.prayers ? `Prayers held: ${m.prayers}.` : "No prayers currently held here.";
  const prayersRo = m.prayers ? `Rugăciuni oficiate: ${m.prayers}.` : "Nu se oficiază rugăciuni în prezent.";
  return {
    en: `Built: ${yearEn}. Status: ${m.statusEn}. ${prayersEn}`,
    ro: `An construcție: ${yearRo}. Stare: ${m.statusRo}. ${prayersRo}`,
  };
}

export class SeedMosquesFromMyMaps1789157965000 implements MigrationInterface {
  name = "SeedMosquesFromMyMaps1789157965000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ id: categoryId }] = await queryRunner.query(
      `SELECT id FROM "categories" WHERE "slug" = 'mosque'`,
    );

    // Attributed to a dedicated system account rather than a real user —
    // submitted_by is NOT NULL and there's no "imported" concept in the
    // schema. Password is a random, never-recorded value: this account is
    // not meant to be logged into, only to satisfy the FK.
    const existingUser = await queryRunner.query(
      `SELECT id FROM "users" WHERE "email" = $1`,
      [IMPORT_USER_EMAIL],
    );
    let userId: string;
    if (existingUser.length > 0) {
      userId = existingUser[0].id;
    } else {
      const passwordHash = await argon2.hash(randomBytes(32).toString("hex"));
      const [{ id }] = await queryRunner.query(
        `INSERT INTO "users" ("email", "password_hash", "role") VALUES ($1, $2, 'admin') RETURNING id`,
        [IMPORT_USER_EMAIL, passwordHash],
      );
      userId = id;
    }

    for (const m of MOSQUES) {
      const description = buildDescription(m);
      const [{ id: poiId }] = await queryRunner.query(
        `INSERT INTO "pois"
          ("name", "description", "location", "address", "status", "submitted_by")
         VALUES (
           $1::jsonb, $2::jsonb,
           ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography,
           $5, 'approved', $6
         )
         RETURNING id`,
        [
          JSON.stringify({ ro: m.name, en: m.name }),
          JSON.stringify(description),
          m.lng,
          m.lat,
          m.address,
          userId,
        ],
      );

      await queryRunner.query(
        `INSERT INTO "poi_categories" ("poi_id", "category_id", "is_primary") VALUES ($1, $2, true)`,
        [poiId, categoryId],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // poi_categories rows cascade with their poi. Only the import user's own
    // POIs are removed — a hand-edited/re-approved copy submitted by someone
    // else wouldn't carry this submitted_by and is left alone.
    await queryRunner.query(
      `DELETE FROM "pois" WHERE "submitted_by" = (SELECT id FROM "users" WHERE "email" = $1)`,
      [IMPORT_USER_EMAIL],
    );
    await queryRunner.query(`DELETE FROM "users" WHERE "email" = $1`, [IMPORT_USER_EMAIL]);
  }
}
