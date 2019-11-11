USER=copypasta
USER_PASS=$USER

mysql -u root --password=spices -h databases <<-EOSQL
 CREATE DATABASE IF NOT EXISTS COPY_DB;
 GRANT ALL ON COPY_DB.* TO '$USER' IDENTIFIED BY '$USER_PASS';
EOSQL


mysql -u $USER --password=$USER_PASS -h databases COPY_DB < COPY_DB.sql

