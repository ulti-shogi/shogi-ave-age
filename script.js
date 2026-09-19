// テーブル描画やソートで使い回すため、リストを外で定義
let kishiList = [];

async function initializeApp() {
    try {
        // ▼ 2つのファイルを同時に読み込む ▼
        const [dataRes, leagueRes] = await Promise.all([
            fetch('kishi-data.txt'),
            fetch('3dan-league.txt')
        ]);

        if (!dataRes.ok || !leagueRes.ok) {
            throw new Error('ファイルの読み込みに失敗しました。');
        } //←if (!dataRes.ok || !leagueRes.ok)

        const dataText = await dataRes.text();
        const leagueText = await leagueRes.text();

        // ▼ 3dan-league.txt を解析し、棋士番号とふりがなを紐づけるMapを作成 ▼
        const readingMap = new Map();
        const leagueLines = leagueText.trim().split('\n');
        for (let i = 1; i < leagueLines.length; i++) {
            const cols = leagueLines[i].split(',');
            if (cols.length >= 2) {
                // 棋士番号(num)をキーにして、ふりがな(reading)を保存
                readingMap.set(parseInt(cols[0], 10), cols[1]);
            } //←if (cols.length >= 2)
        } //←for (let i = 1; i < leagueLines.length; i++)

        // ▼ kishi-data.txt の解析と計算 ▼
        const lines = dataText.trim().split('\n');
        let targetCount = 0;
        let totalBirthTimestamp = 0;
        let totalFourthTimestamp = 0;

        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',');
            if (cols.length < 4) continue;

            const num = parseInt(cols[0], 10);
            
            if (num >= 184) {
                const birthDate = new Date(cols[2].replace(/-/g, '/'));
                const fourthDate = new Date(cols[3].replace(/-/g, '/'));
                
                totalBirthTimestamp += birthDate.getTime();
                totalFourthTimestamp += fourthDate.getTime();
                targetCount++;

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

                // 正確な年齢の並び替え用に、純粋な期間（ミリ秒）も保存
                const ageMs = fourthDate.getTime() - birthDate.getTime();

                kishiList.push({
                    num: num,
                    name: cols[1],
                    reading: readingMap.get(num) || '', // Mapからふりがなを取得
                    ageStr: `${years}歳${months}ヶ月${days}日`,
                    ageMs: ageMs
                }); //←kishiList.push
            } //←if (num >= 184)
        } //←for (let i = 1; i < lines.length; i++)

        if (targetCount === 0) {
            document.getElementById('output').innerHTML = '<p class="error">対象のデータが見つかりませんでした。</p>';
            return;
        } //←if (targetCount === 0)

        // 平均計算と上部結果表示
        const avgBirthDate = new Date(totalBirthTimestamp / targetCount);
        const avgFourthDate = new Date(totalFourthTimestamp / targetCount);

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

        const outputHtml = `
            <p>対象人数： <strong>${targetCount} 名</strong></p>
            <p>生年月日の平均日付： ${avgBirthDate.toLocaleDateString('ja-JP')}</p>
            <p>四段昇段の平均日付： ${avgFourthDate.toLocaleDateString('ja-JP')}</p>
            <div class="result-box">
                <h2>${avgYears}歳 ${avgMonths}ヶ月 ${avgDays}日</h2>
            </div><!--←.result-box-->
        `;
        document.getElementById('output').innerHTML = outputHtml;

        // ▼ 初期表示とソートイベントの設定 ▼
        kishiList.sort((a, b) => a.num - b.num); // 初期状態は棋士番号順
        renderTable();
        setupSortButtons();

    } //←try
    catch (error) {
        document.getElementById('output').innerHTML = `
            <p class="error">エラーが発生しました。両方のテキストファイルが存在するか確認してください。</p>
            <p style="font-size: 0.9rem; color: #666;">詳細: ${error.message}</p>
        `;
    } //←catch (error)
} //←async function initializeApp()

// テーブル描画処理
function renderTable() {
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
    } //←for
    document.getElementById('table-body').innerHTML = tableRowsHtml;
} //←function renderTable()

// ソートボタンのクリックイベント設定
function setupSortButtons() {
    const btns = document.querySelectorAll('.sort-btn');
    
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const col = btn.getAttribute('data-col');
            let order = btn.getAttribute('data-order');
            
            // 昇順/降順を切り替え
            if (order === 'asc') {
                order = 'desc';
            } else {
                order = 'asc';
            } //←if (order === 'asc')

            // 全ボタンのリセット
            btns.forEach(b => {
                b.setAttribute('data-order', 'none');
                b.innerText = '▲▼';
            }); //←btns.forEach(b => ...)

            // クリックされたボタンの表示更新
            btn.setAttribute('data-order', order);
            btn.innerText = order === 'asc' ? '▲' : '▼';

            // リストの並び替え実行
            kishiList.sort((a, b) => {
                let valA, valB;
                
                if (col === 'name') {
                    valA = a.reading;
                    valB = b.reading;
                } else if (col === 'age') {
                    valA = a.ageMs; // 正確なミリ秒で比較
                    valB = b.ageMs;
                } else {
                    valA = a.num;
                    valB = b.num;
                } //←if (col === 'name')

                if (valA < valB) return order === 'asc' ? -1 : 1;
                if (valA > valB) return order === 'asc' ? 1 : -1;
                return 0;
            }); //←kishiList.sort

            // 並び替え後のリストでテーブル再描画
            renderTable();
        }); //←btn.addEventListener
    }); //←btns.forEach(btn => ...)
} //←function setupSortButtons()

// 実行
initializeApp();