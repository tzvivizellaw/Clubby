# Family voice recordings / הקלטות קול משפחתיות

Put recordings in the speaker folder, named exactly as below (variants `_01`, `_02`, `_03` are all optional — any subset works and the game rotates between them). Then run `npm run voices:scan` to update `manifest.json`. No code changes are needed.

שימו את ההקלטות בתיקייה של הדובר, בשם המדויק שבטבלה (גרסאות `_01`, `_02`, `_03` — כל אחת רשות; המשחק מחליף ביניהן). אחר כך מריצים `npm run voices:scan`. אין צורך לשנות קוד.

> Recordings are only used after they are explicitly added to this folder. Nothing is uploaded to any external service.

| Speaker | Event id | File (variant 01) | Line |
|---|---|---|---|
| אבא | `father.where_are_keys` | `father/father_where_are_keys_01.mp3` | נו, מי ראה את המפתחות שלי?! |
| אבא | `father.late_for_reserves` | `father/father_late_for_reserves_01.mp3` | אני מאחר למילואים! |
| אבא | `father.who_touched_computer` | `father/father_who_touched_computer_01.mp3` | מי נגע לי במחשב?! |
| אבא | `father.not_what_i_meant` | `father/father_not_what_i_meant_01.mp3` | רגע, רגע, זה לא מה שהתכוונתי! |
| אבא | `father.champion` | `father/father_champion_01.mp3` | איזה אלוף! |
| אבא | `father.what_is_going_on` | `father/father_what_is_going_on_01.mp3` | מה הולך פה?! |
| אבא | `father.five_minutes_quiet` | `father/father_five_minutes_quiet_01.mp3` | אני רק רציתי חמש דקות שקט! |
| אבא | `father.where_is_phone` | `father/father_where_is_phone_01.mp3` | יופי. עכשיו איפה הטלפון שלי? |
| אמא | `mother.five_minutes_shabbat` | `mother/mother_five_minutes_shabbat_01.mp3` | ילדים, עוד חמש דקות שבת! |
| אמא | `mother.who_left_toys` | `mother/mother_who_left_toys_01.mp3` | מי השאיר את כל הצעצועים בסלון?! |
| אמא | `mother.count_to_three` | `mother/mother_count_to_three_01.mp3` | אני סופרת עד שלוש! |
| אמא | `mother.well_done` | `mother/mother_well_done_01.mp3` | כל הכבוד, אלופים שלי! |
| אמא | `mother.who_wants_shoko` | `mother/mother_who_wants_shoko_01.mp3` | מי רוצה שוקו? |
| אמא | `mother.what_did_you_do_kitchen` | `mother/mother_what_did_you_do_kitchen_01.mp3` | מה עשיתם למטבח?! |
| אביגיל | `avigail.i_will_fix_it` | `avigail/avigail_i_will_fix_it_01.mp3` | תנו לי, אני כבר אסדר את זה! |
| אביגיל | `avigail.told_you` | `avigail/avigail_told_you_01.mp3` | אמרתי לכם שזה מה שיקרה! |
| אביגיל | `avigail.oh_no_again` | `avigail/avigail_oh_no_again_01.mp3` | אוי לא, שוב?! |
| אביגיל | `avigail.yes_did_it` | `avigail/avigail_yes_did_it_01.mp3` | יש! הצלחתי! |
| דניאל | `daniel.three_pointer` | `daniel/daniel_three_pointer_01.mp3` | שלשההה! |
| דניאל | `daniel.best_at_this` | `daniel/daniel_best_at_this_01.mp3` | אני הכי טוב במשחק הזה! |
| דניאל | `daniel.not_fair` | `daniel/daniel_not_fair_01.mp3` | זה בכלל לא פייר! |
| דניאל | `daniel.genius_idea` | `daniel/daniel_genius_idea_01.mp3` | רגע, יש לי רעיון גאוני! |
| ידידיה | `yedidya.i_am_superhero` | `yedidya/yedidya_i_am_superhero_01.mp3` | אני גיבור על! |
| ידידיה | `yedidya.but_why` | `yedidya/yedidya_but_why_01.mp3` | אבל אבא, למה? |
| ידידיה | `yedidya.i_won` | `yedidya/yedidya_i_won_01.mp3` | אני ניצחתי! |
| ידידיה | `yedidya.one_more_story` | `yedidya/yedidya_one_more_story_01.mp3` | עוד סיפור אחד ודי! |
| אסתי | `esti.moo` | `esti/esti_moo_01.mp3` | מוווו! |
| אסתי | `esti.again` | `esti/esti_again_01.mp3` | עוד פעם! |
| אסתי | `esti.where_is_teddy` | `esti/esti_where_is_teddy_01.mp3` | איפה הדובי שלי? |
| אסתי | `esti.abba` | `esti/esti_abba_01.mp3` | אבאאא! |
| אסתי | `esti.want_shoko` | `esti/esti_want_shoko_01.mp3` | אני רוצה שוקו! |

Until a file exists the game uses a temporary fallback (cartoon "babble" voice or browser TTS, chosen in Settings) and shows subtitles.
