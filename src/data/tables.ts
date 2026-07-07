// Auto-generated from Baalrun.xlsx (Documents/d2). Do not hand-edit values.

// Cumulative experience required to BE at each level. totalXpForLevel[L] for L in 1..99.
export const totalXpForLevel: number[] = [
  0, // index 0 unused
  0, // level 1
  500, // level 2
  1500, // level 3
  3750, // level 4
  7875, // level 5
  14175, // level 6
  22680, // level 7
  32886, // level 8
  44396, // level 9
  57715, // level 10
  72144, // level 11
  90180, // level 12
  112725, // level 13
  140906, // level 14
  176132, // level 15
  220165, // level 16
  275207, // level 17
  344008, // level 18
  430010, // level 19
  537513, // level 20
  671891, // level 21
  839864, // level 22
  1049830, // level 23
  1312287, // level 24
  1640359, // level 25
  2050449, // level 26
  2563061, // level 27
  3203826, // level 28
  3902260, // level 29
  4663553, // level 30
  5493363, // level 31
  6397855, // level 32
  7383752, // level 33
  8458379, // level 34
  9629723, // level 35
  10906488, // level 36
  12298162, // level 37
  13815086, // level 38
  15468534, // level 39
  17270791, // level 40
  19235252, // level 41
  21376515, // level 42
  23710491, // level 43
  26254525, // level 44
  29027522, // level 45
  32050088, // level 46
  35344686, // level 47
  38935798, // level 48
  42850109, // level 49
  47116709, // level 50
  51767302, // level 51
  56836449, // level 52
  62361819, // level 53
  68384473, // level 54
  74949165, // level 55
  82104680, // level 56
  89904191, // level 57
  98405658, // level 58
  107672256, // level 59
  117772849, // level 60
  128782495, // level 61
  140783010, // level 62
  153863570, // level 63
  168121381, // level 64
  183662396, // level 65
  200602101, // level 66
  219066380, // level 67
  239192444, // level 68
  261129853, // level 69
  285041630, // level 70
  311105466, // level 71
  339515048, // level 72
  370481492, // level 73
  404234916, // level 74
  441026148, // level 75
  481128591, // level 76
  524840254, // level 77
  572485967, // level 78
  624419793, // level 79
  681027665, // level 80
  742730244, // level 81
  809986056, // level 82
  883294891, // level 83
  963201521, // level 84
  1050299747, // level 85
  1145236814, // level 86
  1248718217, // level 87
  1361512946, // level 88
  1484459201, // level 89
  1618470619, // level 90
  1764543065, // level 91
  1923762030, // level 92
  2097310703, // level 93
  2286478756, // level 94
  2492671933, // level 95
  2717422497, // level 96
  2962400612, // level 97
  3229426756, // level 98
  3520485254, // level 99
];

export const MAX_LEVEL = 99;

// High-level character experience penalty, numerator over 1024. Full (1024) up to lvl 69, then falls off.
export const charLevelPenalty1024: number[] = [
  1024, // index 0 unused
  1024, // level 1
  1024, // level 2
  1024, // level 3
  1024, // level 4
  1024, // level 5
  1024, // level 6
  1024, // level 7
  1024, // level 8
  1024, // level 9
  1024, // level 10
  1024, // level 11
  1024, // level 12
  1024, // level 13
  1024, // level 14
  1024, // level 15
  1024, // level 16
  1024, // level 17
  1024, // level 18
  1024, // level 19
  1024, // level 20
  1024, // level 21
  1024, // level 22
  1024, // level 23
  1024, // level 24
  1024, // level 25
  1024, // level 26
  1024, // level 27
  1024, // level 28
  1024, // level 29
  1024, // level 30
  1024, // level 31
  1024, // level 32
  1024, // level 33
  1024, // level 34
  1024, // level 35
  1024, // level 36
  1024, // level 37
  1024, // level 38
  1024, // level 39
  1024, // level 40
  1024, // level 41
  1024, // level 42
  1024, // level 43
  1024, // level 44
  1024, // level 45
  1024, // level 46
  1024, // level 47
  1024, // level 48
  1024, // level 49
  1024, // level 50
  1024, // level 51
  1024, // level 52
  1024, // level 53
  1024, // level 54
  1024, // level 55
  1024, // level 56
  1024, // level 57
  1024, // level 58
  1024, // level 59
  1024, // level 60
  1024, // level 61
  1024, // level 62
  1024, // level 63
  1024, // level 64
  1024, // level 65
  1024, // level 66
  1024, // level 67
  1024, // level 68
  1024, // level 69
  976, // level 70
  928, // level 71
  880, // level 72
  832, // level 73
  784, // level 74
  736, // level 75
  688, // level 76
  640, // level 77
  592, // level 78
  544, // level 79
  496, // level 80
  448, // level 81
  400, // level 82
  352, // level 83
  304, // level 84
  256, // level 85
  192, // level 86
  144, // level 87
  108, // level 88
  81, // level 89
  61, // level 90
  46, // level 91
  35, // level 92
  26, // level 93
  20, // level 94
  15, // level 95
  11, // level 96
  8, // level 97
  6, // level 98
  5, // level 99
];

// Monster/character level-difference penalty, numerator over 256, keyed by (charLevel - monsterLevel).
// diff <= 5 => full (256); grades down; >=10 => 13.
export const ratioPenalty256: Record<number, number> = {
  0: 256,
  1: 256,
  2: 256,
  3: 256,
  4: 256,
  5: 256,
  6: 207,
  7: 159,
  8: 110,
  9: 61,
  10: 13,
  11: 13,
  12: 13,
  13: 13,
  14: 13,
  15: 13,
  16: 13,
  17: 13,
  18: 13,
  19: 13,
  20: 13,
  21: 13,
  22: 13,
  23: 13,
  24: 13,
  25: 13,
  26: 13,
  27: 13,
  28: 13,
  29: 13,
  30: 13,
  31: 13,
  32: 13,
  33: 13,
  34: 13,
  35: 13,
  36: 13,
  37: 13,
  38: 13,
  39: 13,
  40: 13,
  41: 13,
  42: 13,
  43: 13,
  44: 13,
  45: 13,
  46: 13,
  47: 13,
  48: 13,
  49: 13,
  50: 13,
  51: 13,
  52: 13,
  53: 13,
  54: 13,
  55: 13,
  56: 13,
  57: 13,
  58: 13,
  59: 13,
  60: 13,
  61: 13,
  62: 13,
  63: 13,
  64: 13,
  65: 13,
  66: 13,
  67: 13,
  68: 13,
  69: 13,
  70: 13,
  71: 13,
  72: 13,
  73: 13,
  74: 13,
  75: 13,
  76: 13,
  77: 13,
  78: 13,
  79: 13,
  80: 13,
  81: 13,
  82: 13,
  83: 13,
  84: 13,
  85: 13,
  86: 13,
  87: 13,
  88: 13,
  89: 13,
  90: 13,
  91: 13,
  92: 13,
  93: 13,
  94: 13,
  95: 13,
  96: 13,
  97: 13,
  98: 13,
  99: 13,
};

// Party bonus, numerator over 256, keyed by (partySize - 1). bonus% = value/256*100.
export const partyBonus256: number[] = [
  0, // partySize 1
  87, // partySize 2
  174, // partySize 3
  261, // partySize 4
  348, // partySize 5
  435, // partySize 6
  522, // partySize 7
  609, // partySize 8
];
