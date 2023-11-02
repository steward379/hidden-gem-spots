 資料庫架構：

* 集合 `users`：保存使用者基本資訊。
* 集合 `places`：保存所有景點資訊，包括：
  * `name`：景點的名稱
  * `description`：景點的描述
  * `tags`：景點的標籤
  * `category`：景點的類別（例如「吃的」或「玩的」）
  * `coordinates`：景點的經緯度座標
  * `images`：景點的圖片
  * `userId`：創建景點的使用者 ID
