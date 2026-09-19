async function calculateAverageAge() {
    try {
        // kishi-data.txt を読み込む
        const response = await fetch('kishi-data.txt');
        if (!response.ok) {
            throw new Error('ファイルの読み込みに失敗しました。');
        } //←if (!response.ok)

        const text = await response.text();
        const lines = text.trim().split('\n');
        
        let targetCount = 0;
        let totalBirthTimestamp = 0;
        let totalFourthTimestamp = 0;
        
        // テーブル出力用の配列
        const kishiList = [];

        // ヘッダー行（0行目）を飛ばしてループ処理
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',');
            if (cols.length < 4) continue;

            const num = parseInt(cols[0], 10);
            
            // 棋士番号184以降のみを対象とする
            if (num >= 184) {
                // ハイフンをスラッシュに置換して、時差による日付のズレ（+9時間）を防ぐ
                const birthDate = new Date(cols[2].replace(/-/g, '/'));
                const fourthDate = new Date(cols[3].replace(/-/g, '/'));
                
                // タイムスタンプ（ミリ秒）を加算
                totalBirthTimestamp += birthDate.getTime();
                totalFourthTimestamp += fourthDate.getTime();
                targetCount++;

                // ▼ 個別の四段昇段年齢を計算 ▼
                let years = fourthDate.getFullYear() - birthDate.getFullYear();
                let months = fourthDate.getMonth() - birthDate.getMonth();
                let days = fourthDate.getDate() - birthDate.getDate();

                if (days < 0) {
                    months--;
                    const prevMonth = new Date(fourthDate.getFullYear(), fourthDate.getMonth(), 0);
                    days += prevMonth.getDate();
                } //←if (days < 0)

                if (months < 0) {
                    years--;
                    months += 12;
                } //←if (months < 0)

                // 配列に棋士データを保存
                kishiList.push({
                    num: num,
                    name: cols[1],
                    ageStr: `${years}歳${months}ヶ月${days}日`
                }); //←kishiList.push
            } //←if (num >= 184)
        } //←for (let i = 1; i < lines.length; i++)

        if (targetCount === 0) {
            document.getElementById('output').innerHTML = '<p class="error">対象のデータが見つかりませんでした。</p>';
            return;
        } //←if (targetCount === 0)

        // タイムスタンプの平均を計算
        const avgBirthTimestamp = totalBirthTimestamp / targetCount;
        const avgFourthTimestamp = totalFourthTimestamp / targetCount;

        // 平均日付をDateオブジェクトに変換
        const avgBirthDate = new Date(avgBirthTimestamp);
        const avgFourthDate = new Date(avgFourthTimestamp);

        // 日付の差分から全体の平均年齢（○年○ヶ月○日）を計算
        let avgYears = avgFourthDate.getFullYear() - avgBirthDate.getFullYear();
        let avgMonths = avgFourthDate.getMonth() - avgBirthDate.getMonth();
        let avgDays = avgFourthDate.getDate() - avgBirthDate.getDate();

        if (avgDays < 0) {
            avgMonths--;
            const prevMonth = new Date(avgFourthDate.getFullYear(), avgFourthDate.getMonth(), 0);
            avgDays += prevMonth.getDate();
        } //←if (avgDays < 0)

        if (avgMonths < 0) {
            avgYears--;
            avgMonths += 12;
        } //←if (avgMonths < 0)

        // 上部の結果ボックスにHTMLを出力
        const outputHtml = `
            <p>対象人数： <strong>${targetCount} 名</strong></p>
            <p>生年月日の平均日付： ${avgBirthDate.toLocaleDateString('ja-JP')}</p>
            <p>四段昇段の平均日付： ${avgFourthDate.toLocaleDateString('ja-JP')}</p>
            <div class="result-box">
                <h2>${avgYears}歳 ${avgMonths}ヶ月 ${avgDays}日</h2>
            </div><!--←.result-box-->
        `;
        document.getElementById('output').innerHTML = outputHtml;

        // ▼ テーブルの出力処理 ▼
        // ひとまず棋士番号が若い順（昇順）にソート
        kishiList.sort((a, b) => a.num - b.num);

        let tableRowsHtml = '';
        for (let i = 0; i < kishiList.length; i++) {
            const kishi = kishiList[i];
            tableRowsHtml += `
                <tr>
                    <td>${i + 1}</td>
                    <td>${kishi.name}</td>
                    <td>${kishi.ageStr}</td>
                    <td>${kishi.num}</td>
                </tr><!--←tr-->
            `;
        } //←for (let i = 0; i < kishiList.length; i++)

        // テーブルボディに生成したHTMLを流し込む
        document.getElementById('table-body').innerHTML = tableRowsHtml;

    } //←try
    catch (error) {
        document.getElementById('output').innerHTML = `
            <p class="error">エラーが発生しました。ローカルサーバー環境で実行しているか、同階層に『kishi-data.txt』が存在するか確認してください。</p>
            <p style="font-size: 0.9rem; color: #666;">詳細: ${error.message}</p>
        `;
    } //←catch (error)
} //←async function calculateAverageAge()

// 実行
calculateAverageAge();