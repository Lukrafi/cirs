import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import worldData from "../src/lib/world-data.json";

const prisma = new PrismaClient();

const confederations = [
  { name: "UEFA", code: "UEFA" },
  { name: "CONMEBOL", code: "CONMEBOL" },
  { name: "CONCACAF", code: "CONCACAF" },
  { name: "AFC", code: "AFC" },
  { name: "CAF", code: "CAF" },
  { name: "OFC", code: "OFC" },
] as const;

type L = [string, number, number, number, number, boolean];
function L1(n: string, t = 16, p = 0, r = 2): L { return [n, 1, t, p, r, false]; }
function L2(n: string, t = 16, p = 2, r = 2): L { return [n, 2, t, p, r, false]; }
function LC(n: string, t = 32): L { return [n, 0.5, t, 0, 0, true]; }
function LS(n: string, t = 2): L { return [n, 0, t, 0, 0, true]; }
function LN(n: string, t = 7): L { return [n, -1, t, 0, 0, true]; }

type P = { c: string; n: string; f: string; s: number; l: L[] };
function P_(c: string, n: string, f: string, s: number, l: L[]): P { return { c, n, f, s, l }; }

const data: P[] = [
  // ==================== CONMEBOL (10 países) ====================
  // Todos com 2 divisões + copa + supercopa
  P_("ARG","Argentina","CONMEBOL",9.0,[L1("Liga Profesional",30,0,2),L2("Primera Nacional",20,2,4),LC("Copa Argentina",64),LS("Trofeo de Campeones")]),
  P_("BOL","Bolívia","CONMEBOL",3.5,[L1("División Profesional",16,0,2),L2("Copa Simón Bolívar",16,2,4),LC("Copa Bolivia")]),
  P_("BRA","Brasil","CONMEBOL",9.0,[L1("Série A",20,0,4),L2("Série B",20,4,4),LC("Copa do Brasil",92),LS("Supercopa do Brasil")]),
  P_("CHI","Chile","CONMEBOL",6.0,[L1("Primera División",16,0,2),L2("Primera B",16,2,2),LC("Copa Chile"),LS("Supercopa de Chile")]),
  P_("COL","Colômbia","CONMEBOL",7.0,[L1("Liga BetPlay",20,0,2),L2("Torneo BetPlay",16,2,2),LC("Copa Colombia"),LS("Superliga BetPlay")]),
  P_("ECU","Equador","CONMEBOL",6.0,[L1("Liga Pro",16,0,2),L2("Liga Pro Serie B",10,2,2),LC("Copa Ecuador"),LS("Supercopa Ecuador")]),
  P_("PAR","Paraguai","CONMEBOL",5.0,[L1("Primera División",12,0,2),L2("División Intermedia",16,2,3),LC("Copa Paraguay"),LS("Supercopa Paraguay")]),
  P_("PER","Peru","CONMEBOL",5.5,[L1("Liga 1",18,0,3),L2("Liga 2",18,2,2),LC("Copa Peru"),LS("Supercopa Peruana")]),
  P_("URU","Uruguai","CONMEBOL",8.0,[L1("Primera División",16,0,3),L2("Segunda División",16,3,3),LC("Copa Uruguay"),LS("Supercopa Uruguaya")]),
  P_("VEN","Venezuela","CONMEBOL",4.5,[L1("Primera División",16,0,2),L2("Segunda División",16,2,3),LC("Copa Venezuela")]),

  // ==================== UEFA (55 países) ====================
  // Andorra → 1 divisão (site.txt)
  P_("AND","Andorra","UEFA",1.0,[L1("Primera Divisió",10,0,2),LC("Copa Constitució"),LS("Supercopa")]),
  // Albânia
  P_("ALB","Albânia","UEFA",3.5,[L1("Kategoria Superiore",10,0,2),L2("Kategoria e Parë",12,2,2),LC("Kupa e Shqipërisë"),LS("Superkupa")]),
  // Armênia
  P_("ARM","Armênia","UEFA",2.5,[L1("Premier League",10,0,1),L2("First League",10,1,2),LC("Copa da Armênia"),LS("Supercopa")]),
  // Áustria
  P_("AUT","Áustria","UEFA",5.5,[L1("Bundesliga",12,0,1),L2("2. Liga",16,1,3),LC("ÖFB-Cup",64)]),
  // Azerbaijão
  P_("AZE","Azerbaijão","UEFA",2.5,[L1("Premyer Liqası",10,0,2),L2("Birinci Liqa",10,2,2),LC("Copa"),LS("Supercopa")]),
  // Belarus
  P_("BLR","Belarus","UEFA",3.0,[L1("Vyšâjaja Líha",16,0,2),L2("Pieršaja Líha",16,2,2),LC("Copa"),LS("Supercopa")]),
  // Bélgica
  P_("BEL","Bélgica","UEFA",8.0,[L1("Jupiler Pro League",16,0,2),L2("Challenger Pro League",16,2,2),LC("Copa da Bélgica"),LS("Supercopa")]),
  // Bósnia
  P_("BIH","Bósnia","UEFA",4.0,[L1("Premijer Liga",12,0,2),L2("Prva Liga",16,2,2),LC("Copa da Bósnia")]),
  // Bulgária
  P_("BUL","Bulgária","UEFA",3.5,[L1("Parva Liga",16,0,3),L2("Vtora Liga",16,2,4),LC("Copa"),LS("Supercopa")]),
  // Croácia
  P_("CRO","Croácia","UEFA",7.5,[L1("SuperSport HNL",10,0,1),L2("Prva NL",12,1,2),LC("Copa"),LS("Supercopa")]),
  // Chipre
  P_("CYP","Chipre","UEFA",2.5,[L1("Protágmata",14,0,2),L2("Segunda Divisão",16,2,3),LC("Copa"),LS("Supercopa")]),
  // Rep. Tcheca
  P_("CZE","República Tcheca","UEFA",5.5,[L1("Fortuna Liga",16,0,2),L2("Národní Liga",16,2,2),LC("Pohár FAČR"),LS("Pohár Czech")]),
  // Dinamarca
  P_("DEN","Dinamarca","UEFA",6.5,[L1("Superligaen",12,0,1),L2("1. Division",12,1,2),LC("Sydbank Pokalen")]),
  // Inglaterra
  P_("ENG","Inglaterra","UEFA",8.5,[L1("Premier League",20,0,3),L2("Championship",24,3,3),LC("FA Cup",732),LS("Community Shield"),LC("EFL Cup",92)]),
  // Estônia
  P_("EST","Estônia","UEFA",2.0,[L1("Meistriliiga",10,0,2),L2("Esiliiga",10,2,2),LC("Eesti Karikas"),LS("Superkarikas")]),
  // Ilhas Faroé → 1 divisão (site.txt)
  P_("FRO","Ilhas Faroé","UEFA",1.5,[L1("Betri Deildin",10,0,2),LC("Løgmanssteypið"),LS("Supersteypið")]),
  // Finlância
  P_("FIN","Finlândia","UEFA",3.5,[L1("Veikkausliiga",12,0,1),L2("Ykkösliiga",12,1,2),LC("Suomen Cup"),LS("Liigacup")]),
  // França
  P_("FRA","França","UEFA",9.0,[L1("Ligue 1",18,0,2),L2("Ligue 2",18,2,3),LC("Coupe de France"),LS("Trophée des Champions")]),
  // Geórgia
  P_("GEO","Geórgia","UEFA",4.5,[L1("Erovnuli Liga",10,0,2),L2("Erovnuli Liga 2",10,2,2),LC("Copa"),LS("Supercopa")]),
  // Alemanha
  P_("GER","Alemanha","UEFA",8.5,[L1("Bundesliga",18,0,2),L2("2. Bundesliga",18,2,3),LC("DFB-Pokal",64),LS("DFL-Supercup")]),
  // Gibraltar → 1 divisão (site.txt)
  P_("GIB","Gibraltar","UEFA",1.0,[L1("Gibraltar League",11,0,0),LC("Rock Cup"),LS("Pepe Reyes Cup")]),
  // Grécia
  P_("GRE","Grécia","UEFA",4.5,[L1("Super League 1",14,0,2),L2("Super League 2",20,2,2),LC("Kýpellos Elládos")]),
  // Hungria
  P_("HUN","Hungria","UEFA",5.0,[L1("Nemzeti Bajnokság I",12,0,2),L2("NB II",16,2,2),LC("Magyar Kupa"),LS("Szuperkupa")]),
  // Islândia
  P_("ISL","Islândia","UEFA",3.5,[L1("Besta deild",12,0,2),L2("Lengjudeild",12,2,2),LC("Bikarkeppni"),LS("Meistarakóp")]),
  // Irlanda
  P_("IRL","Irlanda","UEFA",4.5,[L1("Premier Division",10,0,1),L2("First Division",10,1,1),LC("FAI Cup"),LS("President's Cup")]),
  // Israel
  P_("ISR","Israel","UEFA",4.0,[L1("Ligat HaAl",14,0,2),L2("Liga Leumit",16,2,3),LC("State Cup"),LS("Supercopa")]),
  // Itália
  P_("ITA","Itália","UEFA",8.5,[L1("Serie A",20,0,3),L2("Serie B",20,3,4),LC("Coppa Italia"),LS("Supercoppa")]),
  // Cazaquistão
  P_("KAZ","Cazaquistão","UEFA",2.5,[L1("Prem'er Llgasy",14,0,2),L2("Birinsh Llgasy",16,2,2),LC("Kubogy"),LS("Superkubogy")]),
  // Kosovo
  P_("KOS","Kosovo","UEFA",2.5,[L1("Superliga",10,0,2),L2("Liga e Parë",10,2,2),LC("Kupa e Kosovës"),LS("Superkupa")]),
  // Letônia
  P_("LVA","Letônia","UEFA",2.0,[L1("Virsliga",10,0,2),L2("Pirmā līga",10,2,2),LC("Kauss"),LS("Superkauss")]),
  // Liechtenstein → SEM LIGA NACIONAL
  P_("LIE","Liechtenstein","UEFA",1.0,[LN("Liechtenstein Cup", 7)]),
  // Lituânia
  P_("LTU","Lituânia","UEFA",2.0,[L1("A Lyga",10,0,1),L2("Pirma Lyga",16,1,2),LC("Taurė"),LS("Supertaurė")]),
  // Luxemburgo
  P_("LUX","Luxemburgo","UEFA",2.5,[L1("BGL Ligue",16,0,2),L2("Division of Honour",16,2,2),LC("Coupe"),LS("Super Cup")]),
  // Malta
  P_("MLT","Malta","UEFA",1.5,[L1("Premier League",12,0,2),L2("Challenge League",12,2,2),LC("Tazza Maltija"),LS("Super Cup")]),
  // Macedônia do Norte
  P_("MKD","Macedônia do Norte","UEFA",3.0,[L1("Prva Liga",12,0,2),L2("Vtora Liga",16,2,2),LC("Kup"),LS("Superkup")]),
  // Moldávia
  P_("MDA","Moldávia","UEFA",2.0,[L1("Super Liga",8,0,2),L2("Liga 1",12,2,2),LC("Cupa"),LS("Supercupa")]),
  // Montenegro
  P_("MNE","Montenegro","UEFA",3.0,[L1("Prva Liga",10,0,2),L2("Druga Liga",12,2,2),LC("Kup"),LS("Superkup")]),
  // Países Baixos
  P_("NED","Países Baixos","UEFA",8.0,[L1("Eredivisie",18,0,2),L2("Eerste Divisie",20,2,2),LC("Copa KNVB"),LS("Johan Cruijff Schaal")]),
  // Irlanda do Norte
  P_("NIR","Irlanda do Norte","UEFA",3.5,[L1("Premiership",12,0,1),L2("Championship",12,1,2),LC("Irish Cup"),LS("Charity Shield")]),
  // Noruega
  P_("NOR","Noruega","UEFA",5.5,[L1("Eliteserien",16,0,2),L2("OBOS Ligaen",16,2,3),LC("Norgesmesterskapet"),LS("Supercupen")]),
  // Polônia
  P_("POL","Polônia","UEFA",5.5,[L1("Ekstraklasa",18,0,1),L2("I Liga",18,2,3),LC("Puchar Polski"),LS("Superpuchar")]),
  // Portugal
  P_("POR","Portugal","UEFA",8.5,[L1("Primeira Liga",18,0,2),L2("Liga Portugal 2",18,2,3),LC("Taça de Portugal"),LC("Taça da Liga",34),LS("Supertaça")]),
  // Romênia
  P_("ROU","Romênia","UEFA",5.0,[L1("SuperLiga",16,0,2),L2("Liga II",20,2,4),LC("Cupa"),LS("Supercupa")]),
  // Rússia
  P_("RUS","Rússia","UEFA",6.5,[L1("RPL",16,0,2),L2("Pervaya Liga",18,2,3),LC("Kubok"),LS("Superkubok")]),
  // San Marino → 1 divisão (site.txt)
  P_("SMR","San Marino","UEFA",1.0,[L1("Campionato",15,0,0),LC("Coppa Titano"),LS("Supercoppa Sam")]),
  // Escócia
  P_("SCO","Escócia","UEFA",5.0,[L1("Premiership",12,0,1),L2("Championship",10,1,2),LC("Scottish Cup"),LC("League Cup",44)]),
  // Sérvia
  P_("SRB","Sérvia","UEFA",5.5,[L1("Superliga",16,0,2),L2("Prva Liga",16,2,3),LC("Kup"),LS("Superkup")]),
  // Eslováquia
  P_("SVK","Eslováquia","UEFA",4.5,[L1("Niké Liga",12,0,2),L2("Druhá Liga",16,2,2),LC("Slovnak Cup"),LS("Supercup")]),
  // Eslovênia
  P_("SVN","Eslovênia","UEFA",4.0,[L1("PrvaLiga",10,0,1),L2("Druga Liga",16,1,2),LC("Pokal"),LS("Superpokal")]),
  // Espanha
  P_("ESP","Espanha","UEFA",9.0,[L1("La Liga",20,0,3),L2("La Liga 2",22,3,4),LC("Copa del Rey"),LS("Supercopa",4)]),
  // Suécia
  P_("SWE","Suécia","UEFA",5.5,[L1("Allsvenskan",16,0,2),L2("Superettan",16,2,3),LC("Svenska Cupen"),LS("Supercupen")]),
  // Suíça
  P_("SUI","Suíça","UEFA",6.5,[L1("Super League",12,0,1),L2("Challenge League",10,1,2),LC("Swiss Cup"),LS("Super Cup")]),
  // Turquia
  P_("TUR","Turquia","UEFA",6.5,[L1("Süper Lig",20,0,4),L2("1. Lig",20,3,4),LC("Türkiye Kupası"),LS("Süper Kupa")]),
  // Ucrânia
  P_("UKR","Ucrânia","UEFA",6.0,[L1("PremerLiha",16,0,2),L2("Persha Liha",16,2,3),LC("Kubok"),LS("Superkubok")]),
  // País de Gales
  P_("WAL","País de Gales","UEFA",5.0,[L1("Cymru Premier",12,0,2),L2("Cymru North/South",16,2,2),LC("Welsh Cup"),LC("League Cup",44)]),

  // ==================== CAF (54 países) ====================
  // Microestados → 1 divisão (16 times)
  P_("DJI","Djibouti","CAF",1.0,[L1("Premier League",16,0,2),LC("Coupe")]),
  P_("ERI","Eritreia","CAF",1.0,[L1("Premier League",16,0,2),LC("Coupe")]),
  P_("SOM","Somália","CAF",1.0,[L1("Premier League",16,0,2),LC("Cup")]),
  P_("SEY","Seicheles","CAF",1.0,[L1("Premier League",16,0,2),LC("FA Cup")]),
  P_("COM","Comores","CAF",2.0,[L1("Ligue 1",16,0,2),LC("Coupe")]),
  P_("MUS","Maurício","CAF",1.0,[L1("Premier League",16,0,2),LC("FA Cup")]),
  P_("STP","São Tomé e Príncipe","CAF",1.0,[L1("Liga",16,0,2),LC("Taça")]),
  P_("CHA","Chade","CAF",1.0,[L1("Ligue 1",16,0,2),LC("Coupe")]),
  P_("CTA","Rep. Centro-Africana","CAF",1.5,[L1("Ligue 1",16,0,2),LC("Coupe")]),
  P_("SSD","Sudão do Sul","CAF",1.5,[L1("National League",16,0,2),LC("Cup")]),

  // Demais países africanos → 2 divisões (16/16)
  P_("ALG","Argélia","CAF",5.5,[L1("Ligue 1 Mobilis",16,0,2),L2("Ligue 2",16,2,4),LC("Coupe"),LS("Supercoupe")]),
  P_("ANG","Angola","CAF",4.0,[L1("Girabola",16,0,3),L2("Segundona",16,3,3),LC("Taça"),LS("Serra")]),
  P_("BEN","Benim","CAF",2.5,[L1("Ligue 1",16,0,2),L2("Ligue 2",16,2,2),LC("Coupe")]),
  P_("BOT","Botsuana","CAF",2.0,[L1("Premier League",16,0,2),L2("First Division",16,2,2),LC("FA Cup")]),
  P_("BFA","Burkina Faso","CAF",4.0,[L1("Ligue 1",16,0,2),L2("Ligue 2",16,2,2),LC("Coupe"),LS("Supercoupe")]),
  P_("BDI","Burundi","CAF",1.5,[L1("Primus Liga",16,0,2),L2("Ligue B",16,2,2),LC("Coupe")]),
  P_("CMR","Camarões","CAF",5.5,[L1("Elite One",16,0,2),L2("Elite Two",16,2,2),LC("Coupe"),LS("Super Coupe")]),
  P_("CPV","Cabo Verde","CAF",3.5,[L1("Liga",16,0,2),L2("Segunda",16,2,2),LC("Copa"),LS("Supertaça")]),
  P_("COG","Congo","CAF",3.0,[L1("Ligue 1",16,0,2),L2("Ligue 2",16,2,2),LC("Coupe")]),
  P_("COD","RD Congo","CAF",4.0,[L1("Linafoot",16,0,2),L2("Ligue 2",16,2,2),LC("Coupe"),LS("Supercup")]),
  P_("EGY","Egito","CAF",6.5,[L1("Premier League",16,0,2),L2("Second Division",16,2,2),LC("Coupe"),LS("Supercup")]),
  P_("GNQ","Guiné Equatorial","CAF",2.5,[L1("Liga Nacional",16,0,2),L2("Segunda",16,2,2),LC("Coupe")]),
  P_("SWZ","Essuatíni","CAF",1.5,[L1("Premier League",16,0,2),L2("First Division",16,2,2),LC("FA Cup")]),
  P_("ETH","Etiópia","CAF",2.0,[L1("Premier League",16,0,2),L2("Higher League",16,2,2),LC("Coupe"),LS("Supercoupe")]),
  P_("GAB","Gabão","CAF",3.0,[L1("Ligue 1",16,0,2),L2("Ligue 2",16,2,2),LC("Coupe")]),
  P_("GMB","Gâmbia","CAF",2.0,[L1("Liga",16,0,2),L2("Second Division",16,2,2),LC("FA Cup")]),
  P_("GHA","Gana","CAF",5.5,[L1("Premier League",16,0,2),L2("Division One",16,2,2),LC("FA Cup"),LS("Super Cup")]),
  P_("GIN","Guiné","CAF",3.5,[L1("Ligue 1",16,0,2),L2("Ligue 2",16,2,2),LC("Coupe")]),
  P_("GNB","Guiné-Bissau","CAF",2.0,[L1("Ligue 1",16,0,2),L2("Ligue 2",16,2,2),LC("Coupe")]),
  P_("CIV","Costa do Marfim","CAF",6.0,[L1("Ligue 1",16,0,2),L2("Ligue 2",16,2,2),LC("Coupe"),LS("Super Cup")]),
  P_("KEN","Quênia","CAF",3.0,[L1("Premier League",16,0,2),L2("Super League",16,2,2),LC("Cup"),LS("Super Cup")]),
  P_("LSO","Lesoto","CAF",1.5,[L1("Premier League",16,0,2),L2("A Division",16,2,2),LC("FA Cup")]),
  P_("LBR","Libéria","CAF",1.5,[L1("First Division",16,0,2),L2("Second Division",16,2,2),LC("FA Cup")]),
  P_("LBY","Líbia","CAF",2.5,[L1("Liga 1",16,0,2),L2("Liga 2",16,2,2),LC("Coupe")]),
  P_("MAD","Madagascar","CAF",2.0,[L1("Champions League",16,0,2),L2("Ligue 2",16,2,2),LC("FA Cup"),LS("Supercoupe")]),
  P_("MWI","Malawi","CAF",2.0,[L1("Super League",16,0,2),L2("Division 1",16,2,2),LC("FA Cup")]),
  P_("MLI","Mali","CAF",4.0,[L1("Ligue 1",16,0,2),L2("Ligue 2",16,2,2),LC("Coupe"),LS("Super Coupe")]),
  P_("MRT","Mauritânia","CAF",2.5,[L1("Ligue 1",16,0,2),L2("Ligue 2",16,2,2),LC("Coupe"),LS("Supercoupe")]),
  P_("MAR","Marrocos","CAF",7.5,[L1("Botola Pro",16,0,2),L2("Botola 2",16,2,2),LC("Coupe du Trône"),LS("Supercoupe")]),
  P_("MOZ","Moçambique","CAF",2.5,[L1("Moçambola",16,0,2),L2("2ª Divisão",16,2,2),LC("Taça"),LS("Supertaça")]),
  P_("NAM","Namíbia","CAF",2.0,[L1("Premier League",16,0,2),L2("First Division",16,2,2),LC("Cup")]),
  P_("NER","Níger","CAF",2.0,[L1("Ligue 1",16,0,2),L2("Ligue 2",16,2,2),LC("Coupe")]),
  P_("NGA","Nigéria","CAF",6.5,[L1("NPFL",16,0,2),L2("National League",16,2,2),LC("FA Cup"),LS("Super Cup")]),
  P_("RWA","Ruanda","CAF",2.0,[L1("Premier League",16,0,2),L2("Second Division",16,2,2),LC("FA Cup"),LS("Super Cup")]),
  P_("SEN","Senegal","CAF",7.5,[L1("Ligue 1",16,0,2),L2("Ligue 2",16,2,2),LC("Coupe"),LS("Super Cup")]),
  P_("SLE","Serra Leoa","CAF",1.5,[L1("Premier League",16,0,2),L2("First Division",16,2,2),LC("FA Cup")]),
  P_("RSA","África do Sul","CAF",5.5,[L1("DStv Premiership",16,0,2),L2("Motsepe Champ",16,2,2),LC("Nedbank Cup"),LC("MTN 8",8)]),
  P_("SDN","Sudão","CAF",2.5,[L1("Premier League",16,0,2),L2("First Division",16,2,2),LC("Cup")]),
  P_("TZA","Tanzânia","CAF",2.5,[L1("Premier League",16,0,2),L2("First Division",16,2,2),LC("FA Cup"),LS("Community Shield")]),
  P_("TGO","Togo","CAF",2.5,[L1("Ligue 1",16,0,2),L2("Ligue 2",16,2,2),LC("Coupe")]),
  P_("TUN","Tunísia","CAF",5.5,[L1("Ligue Pro 1",16,0,2),L2("Ligue Pro 2",16,2,2),LC("Coupe"),LS("Supercoupe")]),
  P_("UGA","Uganda","CAF",3.0,[L1("Premier League",16,0,2),L2("Big League",16,2,2),LC("FA Cup"),LS("Super Cup")]),
  P_("ZMB","Zâmbia","CAF",3.0,[L1("Super League",16,0,2),L2("First Division",16,2,2),LC("FAZ Cup")]),
  P_("ZWE","Zimbábue","CAF",2.5,[L1("Premier League",16,0,2),L2("First Division",16,2,2),LC("FA Cup")]),

  // ==================== CONCACAF (35 países) ====================
  // Ilhas pequenas → 1 divisão
  P_("AIA","Anguilla","CONCACAF",1.0,[L1("AFA League",8,0,0),LC("Cup")]),
  P_("ARU","Aruba","CONCACAF",1.0,[L1("Division di Honor",10,0,0),LC("Cup")]),
  P_("BAH","Bahamas","CONCACAF",1.0,[L1("BFA League",10,0,0),LC("Cup")]),
  P_("BER","Bermudas","CONCACAF",1.5,[L1("Premier Division",10,0,0),LC("FA Cup")]),
  P_("CAY","Ilhas Cayman","CONCACAF",1.0,[L1("CIFA League",10,0,0),LC("Cup")]),
  P_("CUW","Curaçao","CONCACAF",2.5,[L1("Sekshon Pagá",10,0,0),LC("Cup")]),
  P_("DMA","Dominica","CONCACAF",1.0,[L1("Premier League",10,0,0),LC("Cup")]),
  P_("GRN","Granada","CONCACAF",1.0,[L1("Premier Division",10,0,0),LC("Cup")]),
  P_("GUY","Guiana","CONCACAF",1.5,[L1("GFF Elite League",10,0,0),LC("Cup")]),
  P_("IVB","Ilhas Virgens Britânicas","CONCACAF",1.0,[L1("BVIFA League",8,0,0),LC("Cup")]),
  P_("ISV","Ilhas Virgens EUA","CONCACAF",1.0,[L1("Premier League",8,0,0),LC("Cup")]),
  P_("MSR","Montserrat","CONCACAF",1.0,[L1("MSFA League",8,0,0),LC("Cup")]),
  P_("PUR","Porto Rico","CONCACAF",1.5,[L1("PRSL",10,0,0),LC("Cup")]),
  P_("SMN","Saint Martin","CONCACAF",1.0,[L1("SMFA League",8,0,0),LC("Cup")]),
  P_("SMA","Sint Maarten","CONCACAF",1.0,[L1("SMSA League",8,0,0),LC("Cup")]),
  P_("TCA","Turks e Caicos","CONCACAF",1.0,[L1("Nephew League",8,0,0),LC("Cup")]),
  P_("ATG","Antígua e Barbuda","CONCACAF",2.0,[L1("Premier Division",10,0,0),LC("FA Cup")]),
  P_("SKN","St. Kitts e Nevis","CONCACAF",1.5,[L1("Premier League",10,0,0),LC("Cup")]),
  P_("VIN","St. Vincent e Granadinas","CONCACAF",1.0,[L1("Premier Division",10,0,0),LC("Cup")]),
  P_("LCA","Santa Lúcia","CONCACAF",1.0,[L1("Premier League",10,0,0),LC("Cup")]),

  // Territórios não-FIFA (CONCACAF) — adicionado para power ranking
  P_("BRB","Barbados","CONCACAF",1.0,[L1("Premier Division",10,0,0),LC("Cup")]),
  P_("BOE","Bonaire","CONCACAF",1.0,[L1("Premier League",8,0,0),LC("Cup")]),
  P_("GLP","Guadalupe","CONCACAF",1.0,[L1("Premier Division",10,0,0),LC("Cup")]),
  P_("GUF","Guiana Francesa","CONCACAF",1.0,[L1("Campeonato Nacional",10,0,0),LC("Cup")]),
  P_("MTQ","Martinica","CONCACAF",1.0,[L1("Premier League",10,0,0),LC("Cup")]),

  // Países maiores → 2 divisões
  P_("CAN","Canadá","CONCACAF",5.5,[L1("CPL",16,0,0),L2("CPL 2",16,1,0),LC("Canadian Championship")]),
  P_("CRC","Costa Rica","CONCACAF",5.5,[L1("Liga FPD",12,0,2),L2("Liga de Ascenso",18,2,2),LC("Copa"),LS("Supercopa")]),
  P_("CUB","Cuba","CONCACAF",2.5,[L1("Campeonato Nacional",16,0,2),L2("Primera B",16,2,0),LC("Cup")]),
  P_("DOM","Rep. Dominicana","CONCACAF",2.0,[L1("Liga Dominicana",12,0,2),L2("Segunda",16,2,0),LC("Cup")]),
  P_("SLV","El Salvador","CONCACAF",3.0,[L1("Primera División",12,0,1),L2("Segunda",12,1,2),LC("Cup")]),
  P_("GUA","Guatemala","CONCACAF",3.0,[L1("Liga Nacional",12,0,2),L2("Primera División",16,2,0),LC("Cup")]),
  P_("HAI","Haiti","CONCACAF",2.5,[L1("Equal Haïtienne",16,0,2),L2("Div 2",16,2,0),LC("Cup")]),
  P_("HON","Honduras","CONCACAF",4.0,[L1("Liga Nacional",10,0,2),L2("Liga de Ascenso",16,2,0),LC("Cup")]),
  P_("JAM","Jamaica","CONCACAF",4.0,[L1("Premier League",14,0,2),L2("Championship",14,2,0),LC("FA Cup")]),
  P_("MEX","México","CONCACAF",7.5,[L1("Liga MX",18,0,2),L2("Liga de Expansión",18,2,2),LC("Copa MX"),LS("Supercopa")]),
  P_("NCA","Nicarágua","CONCACAF",2.0,[L1("Primera División",10,0,1),L2("Segunda",12,1,2),LC("Cup")]),
  P_("PAN","Panamá","CONCACAF",4.5,[L1("LPF",12,0,2),L2("Liga Nacional",16,2,0),LC("Cup")]),
  P_("BLZ","Belize","CONCACAF",1.0,[L1("Premier League",10,0,0),L2("First Division",10,1,0),LC("Cup")]),
  P_("SUR","Suriname","CONCACAF",2.0,[L1("Eerste Klasse",12,0,2),L2("Tweede Klasse",12,2,0),LC("Cup")]),
  P_("TTO","Trinidad e Tobago","CONCACAF",3.0,[L1("Pro League",12,0,2),L2("Div 2",16,2,0),LC("FA Cup")]),
  P_("USA","Estados Unidos","CONCACAF",7.0,[L1("MLS",30,0,0),L2("USL Championship",30,0,0),LC("US Open Cup"),LC("Leagues Cup")]),

  // ==================== OFC (11 países) ====================
  // Microestados → 1 divisão
  P_("ASA","Samoa Americana","OFC",1.0,[L1("FFAS League",8,0,0),LC("Cup")]),
  P_("COK","Ilhas Cook","OFC",1.0,[L1("Premier League",8,0,0),LC("Cup")]),
  P_("NIU","Niue","OFC",1.0,[L1("League",8,0,0),LC("Cup")]),
  P_("SAM","Samoa","OFC",1.0,[L1("Premier League",10,0,0),LC("Cup")]),
  P_("TGA","Tonga","OFC",1.0,[L1("Premier League",8,0,0),LC("Cup")]),
  P_("TUV","Tuvalu","OFC",1.0,[L1("A-Division",8,0,0),LC("Cup")]),
  P_("KIR","Kiribati","OFC",1.0,[L1("League",8,0,0),LC("Cup")]),
  P_("PLW","Palau","OFC",1.0,[L1("League",8,0,0),LC("Cup")]),
  P_("FSM","Micronésia","OFC",1.0,[L1("League",8,0,0),LC("Cup")]),

  // Países maiores → 2 divisões
  P_("FIJ","Fiji","OFC",2.0,[L1("NFL",10,0,2),L2("Second Division",10,2,0),LC("Cup")]),
  P_("NZL","Nova Zelândia","OFC",5.0,[L1("NZFC",12,0,0),L2("National League",12,0,0),LC("Chatham Cup")]),
  P_("NCL","Nova Caledônia","OFC",2.0,[L1("Super Ligue",10,0,2),L2("Div 2",10,2,0),LC("Cup")]),
  P_("PNG","Papua Nova Guiné","OFC",2.0,[L1("National Soccer League",10,0,2),L2("Div 2",10,2,0),LC("Cup")]),
  P_("SOL","Ilhas Salomão","OFC",1.5,[L1("Telekom S-League",10,0,2),L2("Div 2",10,2,0),LC("Cup")]),
  P_("TAH","Taiti","OFC",2.0,[L1("Ligue 1",10,0,2),L2("Div 2",10,2,0),LC("Cup"),LS("Super Cup")]),
  P_("VAN","Vanuatu","OFC",1.5,[L1("Premier League",10,0,2),L2("Div 2",10,2,0),LC("Cup")]),

  // ==================== AFC (47 países) ====================
  // Países pequenos → 1 divisão
  P_("AFG","Afeganistão","AFC",1.5,[L1("Premier League",10,0,2),LC("Cup")]),
  P_("BHU","Butão","AFC",1.0,[L1("Premier League",10,0,2),LC("Cup")]),
  P_("BRU","Brunei","AFC",1.0,[L1("Super League",10,0,2),LC("Cup")]),
  P_("GUM","Guam","AFC",1.0,[L1("Guam Soccer League",10,0,2),LC("Cup")]),
  P_("MAC","Macau","AFC",1.0,[L1("Liga de Elite",10,0,2),LC("Cup")]),
  P_("MNG","Mongólia","AFC",1.0,[L1("National Premier League",10,0,2),LC("Cup")]),
  P_("NEP","Nepal","AFC",1.0,[L1("Martyr's Memorial A Div",12,0,2),LC("Cup")]),
  P_("PAK","Paquistão","AFC",1.0,[L1("Premier League",12,0,2),LC("Cup")]),
  P_("LKA","Sri Lanka","AFC",1.0,[L1("Super League",12,0,2),LC("Cup")]),
  P_("TLS","Timor-Leste","AFC",1.0,[L1("Primeira Divisão",10,0,2),LC("Cup")]),
  P_("LAO","Laos","AFC",1.0,[L1("Lao League 1",10,0,2),LC("Cup")]),
  P_("BAN","Bangladesh","AFC",1.5,[L1("Premier League",12,0,2),LC("Cup")]),
  P_("KHM","Camboja","AFC",1.0,[L1("C-League",12,0,2),LC("Cup")]),
  P_("YEM","Iêmen","AFC",1.5,[L1("Premier League",12,0,2),LC("Cup")]),

  // Demais países → 2 divisões
  P_("AUS","Austrália","AFC",6.5,[L1("A-League",14,0,0),L2("ALeague 2",16,1,0),LC("Australia Cup")]),
  P_("BHR","Bahrein","AFC",3.0,[L1("Premier League",12,0,2),L2("Second Division",12,2,2),LC("Kings Cup")]),
  P_("CHN","China","AFC",4.5,[L1("Chinese Super League",16,0,2),L2("China League One",16,2,2),LC("CFA Cup")]),
  P_("HKG","Hong Kong","AFC",2.5,[L1("Premier League",10,0,2),L2("First Division",10,2,2),LC("FA Cup"),LS("Senior Shield")]),
  P_("IND","Índia","AFC",3.5,[L1("Indian Super League",14,0,0),L2("I-League",14,2,0),LC("Super Cup"),LS("Durand Cup")]),
  P_("IDN","Indonésia","AFC",3.0,[L1("Liga 1",18,0,3),L2("Liga 2",18,3,0),LC("Piala")]),
  P_("IRN","Irã","AFC",6.5,[L1("Persian Gulf Pro League",16,0,2),L2("Azadegan League",18,2,0),LC("Hazfi Cup")]),
  P_("IRQ","Iraque","AFC",4.5,[L1("Iraq Stars League",20,0,3),L2("Division 1",20,3,0),LC("Cup")]),
  P_("JPN","Japão","AFC",8.0,[L1("J1 League",20,0,3),L2("J2 League",20,3,4),LC("Emperor Cup"),LS("Super Cup")]),
  P_("JOR","Jordânia","AFC",3.5,[L1("Premier League",12,0,2),L2("First Division",12,2,2),LC("Cup"),LS("Super Cup")]),
  P_("KUW","Kuwait","AFC",2.5,[L1("Premier League",10,0,2),L2("First Division",10,2,0),LC("Cup"),LS("Super Cup")]),
  P_("KGZ","Quirguistão","AFC",2.0,[L1("Premier League",12,0,2),L2("First League",12,2,0),LC("Cup")]),
  P_("LBN","Líbano","AFC",2.5,[L1("Premier League",12,0,2),L2("Second Division",12,2,0),LC("FA Cup")]),
  P_("MAS","Malásia","AFC",3.0,[L1("Super League",14,0,2),L2("Premier League",14,2,0),LC("FA Cup"),LS("Super Cup")]),
  P_("MDV","Maldivas","AFC",1.0,[L1("Dhivehi League",10,0,2),L2("Second Division",10,2,0),LC("Cup")]),
  P_("MMR","Mianmar","AFC",1.5,[L1("MNL",12,0,2),L2("MNL-2",12,2,0),LC("Cup")]),
  P_("PRK","Coreia do Norte","AFC",2.5,[L1("Premier League",12,0,2),L2("Div 2",12,2,0),LC("Cup")]),
  P_("KOR","Coreia do Sul","AFC",7.5,[L1("K League 1",12,0,2),L2("K League 2",14,2,0),LC("Korea Cup"),LS("Super Cup")]),
  P_("OMA","Omã","AFC",3.0,[L1("Premier League",14,0,2),L2("First Division",14,2,0),LC("Cup"),LS("Super Cup")]),
  P_("PHI","Filipinas","AFC",1.5,[L1("PFL",12,0,2),L2("Div 2",12,2,0),LC("Cup")]),
  P_("QAT","Catar","AFC",5.5,[L1("Stars League",12,0,2),L2("Second Division",12,2,0),LC("Emir Cup"),LS("Super Cup")]),
  P_("KSA","Arábia Saudita","AFC",5.5,[L1("Pro League",18,0,2),L2("First Division",18,2,0),LC("King Cup"),LS("Super Cup")]),
  P_("SGP","Singapura","AFC",2.0,[L1("Premier League",10,0,0),L2("Div 2",10,0,0),LC("Singapore Cup"),LC("League Cup")]),
  P_("SYR","Síria","AFC",3.0,[L1("Premier League",14,0,2),L2("Second Division",14,2,0),LC("Cup")]),
  P_("TPE","Taiwan","AFC",2.0,[L1("Premier League",10,0,2),L2("Div 2",10,2,0),LC("Cup")]),
  P_("TJK","Tadjiquistão","AFC",2.5,[L1("Premier League",12,0,2),L2("First League",12,2,0),LC("Cup")]),
  P_("THA","Tailândia","AFC",3.5,[L1("Thai League 1",16,0,3),L2("Thai League 2",18,3,0),LC("FA Cup"),LC("League Cup")]),
  P_("TKM","Turcomenistão","AFC",1.5,[L1("Premier League",10,0,2),L2("First League",10,2,0),LC("Cup")]),
  P_("UAE","Emirados Árabes","AFC",4.5,[L1("Pro League",14,0,2),L2("First Division",14,2,0),LC("Cup"),LS("Super Cup")]),
  P_("UZB","Uzbequistão","AFC",4.5,[L1("Super League",16,0,2),L2("Pro League",16,2,0),LC("Cup")]),
  P_("VIE","Vietnã","AFC",3.5,[L1("V.League 1",14,0,2),L2("V.League 2",14,2,0),LC("Cup")]),
];

const leagueRatingsPath = path.join(__dirname, "..", "src", "lib", "league-ratings.json");
type LeagueRatingEntry = { league: string; country: string; rating: number; aliases?: string[] };
const leagueRatings: Record<string, LeagueRatingEntry[]> = (() => {
  try {
    return JSON.parse(fs.readFileSync(leagueRatingsPath, "utf-8"));
  } catch {
    return {};
  }
})();

function getLeagueRating(countryName: string, leagueName: string): number {
  for (const [, entries] of Object.entries(leagueRatings)) {
    for (const entry of entries) {
      if (entry.country.toLowerCase() !== countryName.toLowerCase()) continue;
      if (entry.league.toLowerCase() === leagueName.toLowerCase()) return entry.rating;
      const aliases = entry.aliases || [];
      if (aliases.some((a) => a.toLowerCase() === leagueName.toLowerCase())) return entry.rating;
    }
  }
  for (const [, entries] of Object.entries(leagueRatings)) {
    for (const entry of entries) {
      if (entry.country.toLowerCase() !== countryName.toLowerCase()) continue;
      if (
        leagueName.toLowerCase().startsWith(entry.league.toLowerCase()) ||
        (entry.league.length > 4 && leagueName.toLowerCase().includes(entry.league.toLowerCase()))
      ) {
        return entry.rating;
      }
      const aliases = entry.aliases || [];
      if (aliases.some((a) => a.toLowerCase() === leagueName.toLowerCase())) return entry.rating;
    }
  }
  return 0;
}

const confCompetitions: Record<string, [string, string, number][]> = {
  UEFA: [
    ["UEFA Champions League", "groups", 36],
    ["UEFA Europa League", "groups", 36],
    ["UEFA Conference League", "groups", 36],
    ["UEFA Super Cup", "knockout", 2],
  ],
  CONMEBOL: [
    ["Copa Libertadores", "groups", 32],
    ["Copa Sul-Americana", "groups", 44],
    ["Recopa Sul-Americana", "knockout", 2],
  ],
  CONCACAF: [
    ["CONCACAF Champions Cup", "knockout", 27],
    ["CONCACAF Central American Cup", "groups", 20],
    ["CONCACAF Caribbean Cup", "groups", 10],
  ],
  AFC: [
    ["AFC Champions League Elite", "groups", 24],
    ["AFC Champions League Two", "groups", 32],
    ["AFC Challenge League", "groups", 20],
  ],
  CAF: [
    ["CAF Champions League", "groups", 16],
    ["CAF Confederation Cup", "groups", 16],
    ["CAF Super Cup", "knockout", 2],
  ],
  OFC: [
    ["OFC Champions League", "groups", 16],
  ],
};

async function main() {
  const existing = await prisma.confederation.count();
  if (existing > 0) {
    console.log("Seed já executado anteriormente. Limpando dados antigos...");
    await prisma.competition.deleteMany();
    await prisma.league.deleteMany();
    await prisma.division.deleteMany();
    await prisma.nationalTeam.deleteMany();
    await prisma.nationalAssociation.deleteMany();
    await prisma.country.deleteMany();
    await prisma.confederation.deleteMany();
    await prisma.club.deleteMany();
    console.log("Dados antigos limpos. Reesemeando...");
  }

  console.log("=== SEED MUNDIAL CIRS ===");
  const now = new Date();

  console.log("Criando 6 confederações...");
  for (const c of confederations) {
    await prisma.confederation.create({ data: { name: c.name, code: c.code } });
  }
  const confs = await prisma.confederation.findMany();
  const confMap = new Map(confs.map((c) => [c.code, c.id]));

  let countryCount = 0;
  let leagueCount = 0;
  let divCount = 0;
  let clubCount = 0;

  for (const p of data) {
    const confId = confMap.get(p.f) || confMap.get("UEFA")!;
    const country = await prisma.country.create({
      data: { name: p.n, code: p.c, confederationId: confId },
    });
    countryCount++;

    await prisma.nationalAssociation.create({
      data: { name: p.n, code: p.c, countryId: country.id, confederationId: confId },
    });

    await prisma.nationalTeam.create({
      data: {
        name: `${p.n}`,
        countryId: country.id,
        confederationId: confId,
        strength: p.s,
      },
    });

    for (const l of p.l) {
      const [lName, lLevel, lTeams, lPromoted, lRelegated, lKnockout] = l;

      let divisionId: string | undefined;
      if (lLevel === 1 || lLevel === 2) {
        const div = await prisma.division.create({
          data: { name: `${p.n} Division ${lLevel}`, countryId: country.id, level: lLevel },
        });
        divCount++;
        divisionId = div.id;
      }

      await prisma.league.create({
        data: {
          name: `${p.n} - ${lName}`,
          countryId: country.id,
          confederationId: confId,
          divisionId: divisionId || null,
          isInternational: false,
          rating: getLeagueRating(p.n, lName),
        },
      });
      leagueCount++;
    }

    // Criar clubes a partir do world-data.json (apenas create, skip duplicates)
    const confedData = (
      worldData as {
        confederations?: Array<{
          name: string;
          countries?: Array<{
            name: string;
            code: string;
            competitions?: Array<{ name: string; type?: string; division?: number; teams?: string[] }>;
          }>;
        }>;
      }
    ).confederations?.find((cd) => cd.name === p.f);
    const countryData = confedData?.countries?.find((cd) => cd.name === p.n || cd.code === p.c);
    if (countryData?.competitions) {
      const divs = await prisma.division.findMany({ where: { countryId: country.id } });
      const divByLevel = new Map(divs.map((d) => [d.level, d.id]));
      const seen = new Set<string>();
      for (const comp of countryData.competitions) {
        if (!comp.teams || comp.teams.length === 0) continue;
        const divLevel = comp.division ?? 1;
        const divisionId = divByLevel.get(divLevel) || null;
        for (const teamName of comp.teams) {
          if (seen.has(teamName)) continue;
          seen.add(teamName);
          try {
            await prisma.club.create({
              data: {
                name: teamName,
                shortName: teamName.split(" ").slice(0, 3).join(" "),
                city: "",
                countryId: country.id,
                divisionId,
                founded: "",
                strength: 5.0,
              },
            });
            clubCount++;
          } catch {
            // Pula clubes duplicados (unique constraint)
          }
        }
      }
    }
  }

  console.log("Criando competições continentais...");
  let compCount = 0;
  for (const [confCode, comps] of Object.entries(confCompetitions)) {
    const confId = confMap.get(confCode);
    if (!confId) continue;
    for (const [compName, compFormat, numTeams] of comps) {
      const isKnock: boolean = compFormat === "knockout";
      let league = await prisma.league.findFirst({
        where: { name: compName, confederationId: confId },
      });
      if (!league) {
        league = await prisma.league.create({
          data: { name: compName, confederationId: confId, isInternational: true },
        });
      }
      await prisma.competition.create({
        data: {
          name: `${compName} ${now.getFullYear()}`,
          type: "continental",
          format: compFormat,
          numTeams,
          isKnockout: isKnock,
          numTurns: compFormat === "knockout" ? 1 : 2,
          promoted: 0,
          relegated: 0,
        },
      });
      compCount++;
    }
  }

  console.log(`\n=== SEED CONCLUÍDO ===`);
  console.log(`  Confederações: ${confs.length}`);
  console.log(`  Países: ${countryCount}`);
  console.log(`  Divisões: ${divCount}`);
  console.log(`  Ligas: ${leagueCount}`);
  console.log(`  Competições continentais de clubes: ${compCount}`);
  console.log(`  Clubes criados: ${clubCount}`);

  console.log("\nCriando competições continentais de seleções...");
  let natCompCount = 0;
  const nationalTeamData: Record<string, [string, number][]> = {
    UEFA: [
      ["UEFA Nations League", 55],
      ["Eurocopa", 24],
    ],
    CONMEBOL: [
      ["Copa América", 16],
      ["Finalíssima", 2],
    ],
    CONCACAF: [
      ["Gold Cup", 16],
      ["CONCACAF Nations League", 41],
    ],
    AFC: [
      ["Copa da Ásia", 24],
      ["AFC Asian Qualifiers", 47],
    ],
    CAF: [
      ["Copa Africana de Nações", 24],
      ["African Nations Championship", 16],
    ],
    OFC: [
      ["OFC Nations Cup", 8],
    ],
  };

  for (const [confCode, comps] of Object.entries(nationalTeamData)) {
    const confId = confMap.get(confCode);
    if (!confId) continue;
    for (const [compName, numTeams] of comps) {
      let league = await prisma.league.findFirst({
        where: { name: compName, confederationId: confId },
      });
      if (!league) {
        league = await prisma.league.create({
          data: { name: compName, confederationId: confId, isInternational: true },
        });
      }
      await prisma.competition.create({
        data: {
          name: `${compName} ${now.getFullYear()}`,
          type: "national_team",
          format: "groups",
          numTeams,
          isKnockout: false,
          numTurns: 2,
          promoted: 0,
          relegated: 0,
        },
      });
      natCompCount++;
    }
  }

  console.log(`  Competições de seleções: ${natCompCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });