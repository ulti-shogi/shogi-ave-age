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

        // 日付の差分から年齢（○年○ヶ月○日）を計算
        let years = avgFourthDate.getFullYear() - avgBirthDate.getFullYear();
        let months = avgFourthDate.getMonth() - avgBirthDate.getMonth();
        let days = avgFourthDate.getDate() - avgBirthDate.getDate();

        // 日数がマイナスの場合の繰り下げ処理
        if (days < 0) {
            months--;
            // 前月の日数を取得して加算
            const prevMonth = new Date(avgFourthDate.getFullYear(), avgFourthDate.getMonth(), 0);
            days += prevMonth.getDate();
        } //←if (days < 0)

        // 月数がマイナスの場合の繰り下げ処理
        if (months < 0) {
            years--;
            months += 12;
        } //←if (months < 0)

        // 結果をHTMLに出力
        const outputHtml = `
            <p>対象人数： <strong>${targetCount} 名</strong></p>
            <p>生年月日の平均日付： ${avgBirthDate.toLocaleDateString('ja-JP')}</p>
            <p>四段昇段の平均日付： ${avgFourthDate.toLocaleDateString('ja-JP')}</p>
            <div class="result-box">
                <h2>${years}歳 ${months}ヶ月 ${days}日</h2>
            </div><!--←.result-box-->
        `;
        document.getElementById('output').innerHTML = outputHtml;

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