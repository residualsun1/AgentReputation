// 1. 配置信息
const CONTRACT_ADDRESS = "0x92E54257fEfd14AE737f9Bf9c09E047A3AdB7ad4";
// 你的 ABI
const ABI = [
    { "name": "NewReview", "type": "event", "inputs": [{ "name": "agentId", "type": "uint256", "indexed": true }, { "name": "reviewer", "type": "address", "indexed": true }, { "name": "score", "type": "uint8", "indexed": false }], "anonymous": false },
    { "name": "rateAgent", "type": "function", "inputs": [{ "name": "_agentId", "type": "uint256" }, { "name": "_score", "type": "uint8" }, { "name": "_comment", "type": "string" }], "outputs": [], "stateMutability": "nonpayable" },
    { "name": "getAllReviews", "type": "function", "inputs": [{ "name": "_agentId", "type": "uint256" }], "outputs": [{ "components": [{ "name": "reviewer", "type": "address" }, { "name": "score", "type": "uint8" }, { "name": "comment", "type": "string" }, { "name": "timestamp", "type": "uint256" }], "internalType": "struct AgentReputation.Review[]", "name": "", "type": "tuple[]" }], "stateMutability": "view" }
];

let provider;
let signer;
let contract;
let currentScore = 0;

// 2. 初始化 dom 元素
const connectBtn = document.getElementById('connectBtn');
const submitBtn = document.getElementById('submitBtn');
const queryBtn = document.getElementById('queryBtn');
const stars = document.querySelectorAll('.star');

// 3. 连接钱包逻辑
connectBtn.onclick = async () => {
    if (typeof window.ethereum === 'undefined') {
        alert("请安装 MetaMask!");
        return;
    }
    try {
        // 请求用户连接
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        // 初始化 Ethers
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

        const address = await signer.getAddress();
        connectBtn.innerText = address.slice(0, 6) + "..." + address.slice(-4);
        submitBtn.disabled = false;
        alert("钱包连接成功！");
    } catch (err) {
        console.error(err);
        alert("连接失败");
    }
};

// 4. 星星点击交互
stars.forEach(star => {
    star.onclick = () => {
        currentScore = parseInt(star.dataset.value);
        stars.forEach(s => {
            s.classList.toggle('active', s.dataset.value <= currentScore);
        });
    };
});

// 5. 提交评价 (写入合约)
submitBtn.onclick = async () => {
    const agentId = document.getElementById('agentIdInput').value;
    const comment = document.getElementById('commentInput').value;

    if (!agentId || currentScore === 0) {
        alert("请填写入 Agent ID 并打分");
        return;
    }

    try {
        submitBtn.innerText = "提交中...";
        submitBtn.disabled = true;

        // 调用合约的 rateAgent 函数
        const tx = await contract.rateAgent(agentId, currentScore, comment);

        console.log("交易发送成功:", tx.hash);
        alert(`交易已发送，等待上链... Hash: ${tx.hash}`);

        // 等待交易被打包
        await tx.wait();
        alert("评分成功上链！🎉");

        // 重置表单
        document.getElementById('commentInput').value = "";
        submitBtn.innerText = "提交评价";
        submitBtn.disabled = false;
    } catch (err) {
        console.error(err);
        alert("提交失败，请看控制台");
        submitBtn.innerText = "提交评价";
        submitBtn.disabled = false;
    }
};

// 6. 查询评价 (读取合约)
queryBtn.onclick = async () => {
    const agentId = document.getElementById('queryIdInput').value;
    if (!agentId) return;

    if (!contract) {
        // 如果还没连钱包，也可以用只读模式连，但为了简单我们先要求连钱包
        alert("请先连接钱包");
        return;
    }

    try {
        queryBtn.innerText = "加载中...";
        const reviews = await contract.getAllReviews(agentId);

        const list = document.getElementById('reviewsList');
        list.innerHTML = ""; // 清空列表

        if (reviews.length === 0) {
            list.innerHTML = "<p style='color:#94a3b8;text-align:center;'>暂无评价</p>";
        }

        // 倒序显示，最新的在前面
        [...reviews].reverse().forEach(review => {
            const div = document.createElement('div');
            div.className = 'review-item';
            // 转换时间戳
            const date = new Date(review.timestamp * 1000).toLocaleString();

            div.innerHTML = `
                <div class="review-header">
                    <span>👤 ${review.reviewer.slice(0, 6)}...</span>
                    <span>${date}</span>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span class="review-score">${"★".repeat(review.score)}</span>
                </div>
                <p style="margin:8px 0 0 0;font-size:0.95rem;">${review.comment}</p>
            `;
            list.appendChild(div);
        });
    } catch (err) {
        console.error(err);
        alert("读取失败");
    } finally {
        queryBtn.innerText = "查询";
    }
};