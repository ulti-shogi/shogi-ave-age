// テーブル描画やソートで使い回すため、リストを外で定義
let kishiList = [];

async function initializeApp() {
    try {
        const [dataRes, leagueRes] = await Promise.all([
            fetch('kishi-data.txt'),
            fetch('3dan-league.txt')
        ]);

        if (!dataRes.ok || !leagueRes.ok) {
            throw new Error('ファイルの読み込みに失敗しました。');
        } //←if (!dataRes.ok || !leagueRes.ok)

        const dataText = await dataRes.text();
        const leagueText = await leagueRes.text();

        const readingMap = new Map();
        const leagueLines = leagueText.trim().split('\n');
        for (let i = 1; i < leagueLines.length; i++) {
            const cols = leagueLines[i].split(',');
            if (cols.length >= 2) {
                readingMap.set(parseInt(cols[0], 10), cols[1]);
            } //←if (cols.length >= 2)
        } //←for (let i = 1; i < leagueLines.length; i++)

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

                const strMonths = months < 10 ? ' ' + months : months;
                const strDays = days < 10 ? ' ' + days : days;

                const ageMs = fourthDate.getTime() - birthDate.getTime();

                kishiList.push({
                    num: num,
                    name: cols[1],
                    reading: readingMap.get(num) || '',
                    ageStr: `${years}歳${strMonths}ヶ月${strDays}日`,
                    ageMs: ageMs
                }); //←kishiList.push
            } //←if (num >= 184)
        } //←for (let i = 1; i < lines.length; i++)

        if (targetCount === 0) {
            document.getElementById('output').innerHTML = '<p class="error">対象のデータが見つかりませんでした。</p>';
            return;
        } //←if (targetCount === 0)

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

        // ▼ HTML出力を変更（計算方法の説明文を追加） ▼
        const outputHtml = `
            <div class="result-box">
                <div class="result-title">将棋棋士の四段昇段平均年齢</div>
                <div class="result-age">${avgYears}歳 ${avgMonths}ヶ月 ${avgDays}日</div>
                <div class="result-desc">現行の奨励会三段リーグ開始以降に四段に昇段した計${targetCount}名が対象</div>
            </div><!--←.result-box-->
            <div class="calc-desc">
                ※算出された平均年齢は、対象棋士の「生年月日の平均（${avgBirthDate.toLocaleDateString('ja-JP')}）」から「四段昇段日の平均（${avgFourthDate.toLocaleDateString('ja-JP')}）」までの期間を計算したものです。
            </div><!--←.calc-desc-->
        `;
        document.getElementById('output').innerHTML = outputHtml;

        kishiList.sort((a, b) => a.num - b.num);
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

function setupSortButtons() {
    const btns = document.querySelectorAll('.sort-btn');
    
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const col = btn.getAttribute('data-col');
            let order = btn.getAttribute('data-order');
            
            if (order === 'asc') {
                order = 'desc';
            } else {
                order = 'asc';
            } //←if (order === 'asc')

            btns.forEach(b => {
                b.setAttribute('data-order', 'none');
                b.innerText = '▲▼';
            }); //←btns.forEach(b => ...)

            btn.setAttribute('data-order', order);
            btn.innerText = order === 'asc' ? '▲' : '▼';

            kishiList.sort((a, b) => {
                let valA, valB;
                
                if (col === 'name') {
                    valA = a.reading;
                    valB = b.reading;
                } else if (col === 'age') {
                    valA = a.ageMs;
                    valB = b.ageMs;
                } else {
                    valA = a.num;
                    valB = b.num;
                } //←if (col === 'name')

                if (valA < valB) return order === 'asc' ? -1 : 1;
                if (valA > valB) return order === 'asc' ? 1 : -1;
                return 0;
            }); //←kishiList.sort

            renderTable();
        }); //←btn.addEventListener
    }); //←btns.forEach(btn => ...)
} //←function setupSortButtons()

initializeApp();