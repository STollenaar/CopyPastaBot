BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS `submissions` (
	`ID`	TEXT NOT NULL,
	`Title`	TEXT NOT NULL,
	PRIMARY KEY(`ID`)
);

CREATE TABLE IF NOT EXISTS `config` (
	`AuthTkn`	TEXT NOT NULL DEFAULT 'tkn',
	`Debug`	TEXT NOT NULL DEFAULT 'false',
	`DebugServer`	NUMERIC NOT NULL DEFAULT 'server',
	`IntervalTimeInSeconds`	INTEGER NOT NULL DEFAULT 100,
	`User_Agent`	NUMERIC NOT NULL DEFAULT 'agent',
	`Client_Id`	TEXT NOT NULL DEFAULT 'id',
	`Client_Secret`	TEXT NOT NULL DEFAULT 'secret',
	`Username`	BLOB NOT NULL DEFAULT 'username',
	`Password`	TEXT NOT NULL DEFAULT 'password',
	`MinUpvotes`	INTEGER NOT NULL DEFAULT 10,
	`PostLimit`	INTEGER NOT NULL DEFAULT 10,
	`MessageLimit`	INTEGER NOT NULL DEFAULT 2000,
	`PageSize`	INTEGER NOT NULL DEFAULT 10,
	`LogOffMessages`	TEXT DEFAULT '["'
);
INSERT or IGNORE INTO `config` (AuthTkn,Debug,DebugServer,IntervalTimeInSeconds,User_Agent,Client_Id,Client_Secret,Username,Password,MinUpvotes,PostLimit,MessageLimit,PageSize,LogOffMessages) VALUES ('tkn','false','server',100,'agent','id','secret','username','password',10,10,2000,10,'["I feel so sleepy... think I''m just going to lie down.. for... a..... while...", "OMG SOMEONE STABBED ME WITH A FOOKING KNIFE.. IT HURTS.. I... I.. I THINK I''M DYING."]');
COMMIT;
