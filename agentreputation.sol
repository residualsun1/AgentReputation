// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AgentReputation {
    
    // 定义一个评价的结构：包含 评分人、分数、评论内容
    struct Review {
        address reviewer; // 谁打的分
        uint8 score;      // 分数 (1-5)
        string comment;   // 具体的评价
        uint256 timestamp; // 时间戳
    }

    // 建立一个映射：通过 Agent ID (数字) 就能查到它所有的 评价列表
    mapping(uint256 => Review[]) public agentReviews;

    // 一个事件：当有人打分成功时，通知区块链外的世界
    event NewReview(uint256 indexed agentId, address indexed reviewer, uint8 score);

    // --- 功能函数 ---

    // 1. 打分函数
    // agentId: 给哪个AI打分, score: 几颗星, comment: 评价内容
    function rateAgent(uint256 _agentId, uint8 _score, string memory _comment) public {
        // 检查：分数必须在 1 到 5 之间
        require(_score >= 1 && _score <= 5, "Score must be between 1 and 5");

        // 创建一个新的评价
        Review memory newReview = Review({
            reviewer: msg.sender, // msg.sender 就是调用这个函数的人（钱包地址）
            score: _score,
            comment: _comment,
            timestamp: block.timestamp
        });

        // 把它加入到列表中
        agentReviews[_agentId].push(newReview);

        // 发出通知
        emit NewReview(_agentId, msg.sender, _score);
    }

    // 2. 查询某个 Agent 有多少条评价
    function getReviewCount(uint256 _agentId) public view returns (uint256) {
        return agentReviews[_agentId].length;
    }

    // 3. 获取特定的某一条评价 (因为数组太长不能一次取完，通常需要分页或者按索引取)
    function getReview(uint256 _agentId, uint256 _index) public view returns (address, uint8, string memory, uint256) {
        Review memory review = agentReviews[_agentId][_index];
        return (review.reviewer, review.score, review.comment, review.timestamp);
    }
    
    // 4. 获取某个 Agent 的所有评价（注意：如果评价太多，这个函数可能会因为Gas超限而失败，但做Demo没问题）
    function getAllReviews(uint256 _agentId) public view returns (Review[] memory) {
        return agentReviews[_agentId];
    }
}